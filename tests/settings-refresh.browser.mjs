/** UI regression on the existing Host; all role data and test events stay in this browser context. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const { launchPinnedChromium } = await import(pathToFileURL(join(homedir(), '.codex/playwright-runtime/runtime.mjs')).href)
const candidate = process.argv[2] === undefined ? undefined : await readFile(resolve(process.argv[2]), 'utf8')
const origin = 'http://127.0.0.1:43127'
const base = {
  provider: 'deepseek-official', providerName: 'Fixture', model: 'fixture-base', modelName: 'Fixture base',
  selectable: true, source: 'api-key', routeRegistered: true, efforts: [{ id: 'high', name: 'High' }],
}
const glm = {
  ...base, provider: 'pi-zai-coding-cn', model: 'glm-5.3-flash', modelName: 'GLM', source: 'oauth', oauthSignedIn: true,
}
let routes = [base]
let requests = 0
let eventSeq = 0
let holdNext
const snapshot = () => ({
  catalog: {
    routes, selectableCount: routes.length, oauthPluginPresent: true, oauthStorePresent: true,
    oauthSignedInProviders: [], overlayPath: '(test-only)', overlayMissing: true,
    inheritParent: true, recommendOauthLogin: false,
  },
  overlay: { version: 1, roles: {} }, path: '(test-only)', missing: true, droppedRoles: [],
})

const browser = await launchPinnedChromium()
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => { errors.push(error.message) })
  // Feed a synthetic Host notification into this page's real transport handler.
  // Replies for these synthetic RPC ids are suppressed; they never reach the Host.
  await page.addInitScript(() => {
    const NativeWebSocket = window.WebSocket
    window.__pstackTestHostSockets = []
    window.WebSocket = class extends NativeWebSocket {
      constructor(...args) {
        super(...args)
        if (new URL(String(args[0]), location.href).pathname === '/api/events.host') window.__pstackTestHostSockets.push(this)
      }
      send(data) {
        if (typeof data === 'string') {
          let parsed
          try { parsed = JSON.parse(data) } catch { /* Non-JSON frames pass through unchanged. */ }
          if (String(parsed?.rpcId ?? '').startsWith('pstack-ui-fixture-')) return
        }
        return super.send(data)
      }
    }
  })
  await page.route(`${origin}/plugins/pstack-dsh/settings`, async route => {
    assert.equal(route.request().method(), 'GET', 'This test must not write settings')
    requests += 1
    const body = JSON.stringify(snapshot())
    if (holdNext !== undefined) {
      const wait = holdNext
      holdNext = undefined
      await wait
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body })
  })
  if (candidate !== undefined) {
    await page.route(/\/plugins\/pstack-dsh\/client\.js(?:\?.*)?$/, route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: candidate }))
  }
  const notify = async (event = 'llm/adapters-updated', args = []) => {
    // An idle Host need not send any frame after the socket opens.
    await page.waitForFunction(() => window.__pstackTestHostSockets.some(socket => socket.readyState === WebSocket.OPEN))
    await page.evaluate(({ seq, event, args }) => {
      const socket = window.__pstackTestHostSockets.findLast(value => value.readyState === WebSocket.OPEN)
      if (socket === undefined) throw new Error('No active Host event socket')
      socket.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'server-request', rpcId: `pstack-ui-fixture-${seq}`, method: 'host/remote-event',
          payload: { type: 'host/remote-event', event, args },
        }),
      }))
    }, { seq: ++eventSeq, event, args })
  }
  const hasChoice = async (value, available = true) => {
    await page.waitForFunction(({ value, available }) => {
      const option = [...document.querySelectorAll('#pstack-role-feature option')].find(entry => entry.value === value)
      return option !== undefined && option.disabled === !available
    }, { value, available }, { timeout: 6000 })
  }
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.getByText('设置', { exact: true }).first().click()
  await page.getByText('pstack 角色', { exact: true }).first().click()
  const feature = page.locator('#pstack-role-feature')
  await feature.selectOption('deepseek-official::fixture-base')
  await page.locator('#pstack-effort-feature').selectOption('high')
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isEnabled(), true)

  routes = [base, glm]
  await notify()
  await hasChoice('pi-zai-coding-cn::glm-5.3-flash')
  assert.equal(await feature.inputValue(), 'deepseek-official::fixture-base')
  assert.equal(await page.locator('#pstack-effort-feature').inputValue(), 'high')
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isEnabled(), true)

  const beforeManual = requests
  const manualResponse = page.waitForResponse(response => response.url() === `${origin}/plugins/pstack-dsh/settings`)
  await page.getByRole('button', { name: '刷新模型列表', exact: true }).click()
  await manualResponse
  assert.ok(requests > beforeManual)
  assert.equal(await feature.inputValue(), 'deepseek-official::fixture-base')
  assert.equal(await page.locator('#pstack-effort-feature').inputValue(), 'high')

  routes = [glm]
  await notify('credentials/reference-updated', ['fixture-key'])
  await hasChoice('deepseek-official::fixture-base', false)
  assert.equal(await feature.inputValue(), 'deepseek-official::fixture-base')
  assert.match(await feature.locator('option:checked').innerText(), /暂不可用/)

  routes = [base, glm]
  await page.evaluate(() => { window.dispatchEvent(new Event('focus')) })
  await hasChoice('deepseek-official::fixture-base')
  assert.equal(await page.locator('#pstack-effort-feature').inputValue(), 'high')

  // A slow pre-change snapshot must not replace a newer catalog.
  let release
  holdNext = new Promise(resolve => { release = resolve })
  routes = [base, glm, { ...glm, model: 'stale-fixture' }]
  const beforeSlow = requests
  await notify()
  await page.waitForTimeout(100)
  assert.ok(requests > beforeSlow)
  routes = [base, glm, { ...glm, model: 'latest-fixture' }]
  await notify()
  await hasChoice('pi-zai-coding-cn::latest-fixture')
  release()
  await page.waitForTimeout(100)
  assert.equal(await feature.locator('option[value="pi-zai-coding-cn::stale-fixture"]').count(), 0)

  await page.getByText('通用设置', { exact: true }).first().click()
  await page.locator('.pstack-page').waitFor({ state: 'detached' })
  const afterClose = requests
  await notify()
  await page.waitForTimeout(100)
  assert.equal(requests, afterClose, 'Closing the role page must unsubscribe')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({
    url: origin, candidate: candidate !== undefined, simulatedHostNotifications: true,
    automaticModelUpdate: true, unsavedRoleAndEffortPreserved: true,
    logoutChoiceMarked: true, staleResponseIgnored: true, unsubscribedOnClose: true,
    writes: 0,
  }, null, 2))
} finally {
  await browser.close()
}
