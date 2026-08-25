import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { loadSettingsSnapshot, saveSettingsOverlay } from '../src/settings-api.ts'
import { OVERLAY_FILENAME } from '../src/ids.ts'

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
})
