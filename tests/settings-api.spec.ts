import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { loadSettingsSnapshot, saveSettingsOverlay } from '../src/settings-api.ts'
import { OAUTH_AUTH_FILENAME, OVERLAY_FILENAME } from '../src/ids.ts'
import { listenForCatalogChanges, type CatalogEventContext } from '../src/client/api.ts'

function llmStub() {
  return {
    listProviders: () => [{ id: 'deepseek-official', name: 'DeepSeek' }],
    async listModels() {
      return [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }]
    },
    async resolveModelInfo() {
      return { id: 'deepseek-chat', name: 'DeepSeek Chat', reasoning: { efforts: [{ id: 'high', name: 'High' }] } }
    },
  }
}

describe('settings snapshot/save', () => {
  it('loads inherit overlay and empty catalog when nothing is logged in', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-settings-empty-'))
    const snapshot = await loadSettingsSnapshot({
      dshHome: home,
      env: {},
      llm: {
        listProviders: () => [],
        async listModels() { return [] },
        async resolveModelInfo() { return { id: 'x', name: 'x' } },
      },
    })
    assert.equal(snapshot.catalog.selectableCount, 0)
    assert.equal(snapshot.overlay.roles.feature?.inherit, true)
    assert.equal(snapshot.missing, true)
    assert.equal(snapshot.catalog.recommendOauthLogin, true)
    assert.equal(snapshot.path.endsWith(OVERLAY_FILENAME), true)
  })

  it('writes the same overlay file spawn reads, logged-in routes only', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-settings-save-'))
    const host = {
      dshHome: home,
      env: {},
      llm: llmStub(),
      credentials: {
        async describe(ref: string) {
          return { configured: ref === 'DEEPSEEK_API_KEY' }
        },
      },
    }
    const saved = await saveSettingsOverlay(host, {
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' }],
        },
      },
    })
    const text = await readFile(saved.path, 'utf8')
    assert.match(text, /deepseek-official/)
    assert.match(text, /"high"/)
    const snapshot = await loadSettingsSnapshot(host)
    assert.equal(snapshot.overlay.roles.feature?.routes[0]?.reasoningEffort, 'high')
    assert.equal(snapshot.missing, false)
  })

  it('rejects a vendor slug the live catalog does not list', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-settings-reject-'))
    await assert.rejects(() => saveSettingsOverlay({
      dshHome: home,
      env: {},
      llm: llmStub(),
      credentials: {
        async describe(ref: string) {
          return { configured: ref === 'DEEPSEEK_API_KEY' }
        },
      },
    }, {
      version: 1,
      roles: {
        feature: { inherit: false, routes: [{ provider: 'openai', model: 'gpt-4' }] },
      },
    }), /not a logged-in live route/)
  })

  it('sees login, model additions and logout on the next request, including save validation', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-settings-login-'))
    const models = [{ id: 'glm-5.3-flash', name: 'GLM' }]
    const host = {
      dshHome: home,
      env: {},
      llm: {
        listProviders: () => [{ id: 'pi-zai-coding-cn', name: 'GLM' }],
        async listModels() { return models },
        async resolveModelInfo(_provider: string, model: string) { return { id: model, name: model } },
      },
    }
    assert.equal((await loadSettingsSnapshot(host)).catalog.selectableCount, 0)
    await writeFile(join(home, OAUTH_AUTH_FILENAME), JSON.stringify({ credentials: { 'zai-coding-cn': {} } }))
    const loggedIn = await loadSettingsSnapshot(host)
    assert.deepEqual(loggedIn.catalog.routes.map(route => route.model), ['glm-5.3-flash'])

    const saved = await saveSettingsOverlay(host, {
      version: 1,
      roles: { feature: { inherit: false, routes: [{ provider: 'pi-zai-coding-cn', model: 'glm-5.3-flash' }] } },
    })
    models.push({ id: 'new-live-model', name: 'New live model' })
    assert.equal((await loadSettingsSnapshot(host)).catalog.selectableCount, 2)

    const savedBytes = await readFile(saved.path, 'utf8')
    await writeFile(join(home, OAUTH_AUTH_FILENAME), JSON.stringify({ credentials: {} }))
    const loggedOut = await loadSettingsSnapshot(host)
    assert.equal(loggedOut.catalog.selectableCount, 0)
    assert.deepEqual(loggedOut.droppedRoles, ['feature'])
    assert.equal(await readFile(saved.path, 'utf8'), savedBytes)
    await assert.rejects(() => saveSettingsOverlay(host, saved.overlay), /not a logged-in live route/)
  })
})

describe('client catalog notifications', () => {
  it('refreshes on Host login, settings, credential and reconnect events, then unsubscribes', () => {
    const listeners = new Map<string, () => void>()
    const subscribe = (event: string, listener: () => void) => {
      listeners.set(event, listener)
      return () => { listeners.delete(event) }
    }
    const ctx: CatalogEventContext = { remote: { $on: subscribe }, on: subscribe }
    let refreshes = 0
    const stop = listenForCatalogChanges(ctx, () => { refreshes += 1 })
    for (const event of ['llm/adapters-updated', 'settings/document-updated', 'credentials/reference-updated', 'connection/reset']) {
      const listener = listeners.get(event)
      assert.ok(listener, `${event} must reach the role selector`)
      listener()
    }
    assert.equal(refreshes, 4)
    stop()
    assert.equal(listeners.size, 0)
  })
})
