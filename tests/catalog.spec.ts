import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { buildCatalog } from '../src/catalog.ts'
import { OAUTH_AUTH_FILENAME } from '../src/ids.ts'

function llmStub(options: {
  providers: { id: string; name: string }[]
  models: Record<string, { id: string; name: string }[]>
  efforts?: Record<string, { id: string; name: string }[]>
}) {
  return {
    listProviders: () => options.providers,
    async listModels(provider: string) {
      return options.models[provider] ?? []
    },
    async resolveModelInfo(provider: string, model: string) {
      const key = `${provider}::${model}`
      const efforts = options.efforts?.[key]
      return {
        id: model,
        name: model,
        ...efforts ? { reasoning: { efforts } } : {},
      }
    },
  }
}

describe('buildCatalog', () => {
  it('is empty and inherit-only when nothing is logged in', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-empty-'))
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({ providers: [], models: {} }),
    })
    assert.equal(catalog.selectableCount, 0)
    assert.equal(catalog.inheritParent, true)
    assert.equal(catalog.recommendOauthLogin, true)
    assert.match(catalog.emptyReason ?? '', /dsh-oauth-login/)
    assert.equal(catalog.routes.length, 0)
  })

  it('omits a registered adapter with no configured key', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-nokey-'))
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({
        providers: [{ id: 'deepseek-official', name: 'DeepSeek' }],
        models: { 'deepseek-official': [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }] },
      }),
      credentials: {
        async describe() {
          return { configured: false }
        },
      },
    })
    assert.equal(catalog.selectableCount, 0)
    assert.equal(catalog.routes.length, 0)
  })

  it('lists a DeepSeek route only when the key is configured', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-key-'))
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({
        providers: [{ id: 'deepseek-official', name: 'DeepSeek' }],
        models: { 'deepseek-official': [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }] },
        efforts: { 'deepseek-official::deepseek-chat': [{ id: 'high', name: 'High' }] },
      }),
      credentials: {
        async describe(ref: string) {
          return { configured: ref === 'DEEPSEEK_API_KEY' }
        },
      },
    })
    assert.equal(catalog.selectableCount, 1)
    assert.equal(catalog.routes[0]?.provider, 'deepseek-official')
    assert.equal(catalog.routes[0]?.model, 'deepseek-chat')
    assert.equal(catalog.routes[0]?.selectable, true)
    assert.deepEqual(catalog.routes[0]?.efforts.map(effort => effort.id), ['high'])
  })

  it('does not list unsigned-in vendor ids from a missing oauth store', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-novendor-'))
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({
        providers: [{ id: 'openai', name: 'OpenAI' }],
        models: { openai: [{ id: 'gpt-4', name: 'GPT-4' }] },
      }),
    })
    assert.equal(catalog.routes.some(route => route.provider === 'openai'), false)
  })

  it('surfaces signed-in oauth store ids that are not yet registered', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-oauth-'))
    await writeFile(
      join(home, OAUTH_AUTH_FILENAME),
      JSON.stringify({ credentials: { anthropic: { token: 'redacted-in-real-store' } } }),
      'utf8',
    )
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({ providers: [], models: {} }),
    })
    const hinted = catalog.routes.find(route => route.provider === 'pi-anthropic')
    assert.ok(hinted)
    assert.equal(hinted.selectable, false)
    assert.match(hinted.hint ?? '', /dsh-oauth-login/)
    assert.equal(catalog.selectableCount, 0)
  })

  it('lists a live pi-* route when the adapter is registered and the store is signed in', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-pi-'))
    await writeFile(
      join(home, OAUTH_AUTH_FILENAME),
      JSON.stringify({ credentials: { anthropic: {} } }),
      'utf8',
    )
    const catalog = await buildCatalog({
      dshHome: home,
      env: {},
      llm: llmStub({
        providers: [{ id: 'pi-anthropic', name: 'Claude' }],
        models: { 'pi-anthropic': [{ id: 'claude-sonnet-4-6', name: 'Sonnet' }] },
        efforts: {},
      }),
    })
    assert.equal(catalog.selectableCount, 1)
    assert.equal(catalog.routes[0]?.provider, 'pi-anthropic')
    assert.equal(catalog.routes[0]?.source, 'oauth')
    assert.equal(catalog.routes[0]?.efforts.length, 0)
    assert.equal(catalog.recommendOauthLogin, false)
  })
})
