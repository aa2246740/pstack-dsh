import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  parseOverlay,
  readOverlay,
  validateOverlayAgainstCatalog,
  writeOverlay,
} from '../src/overlay.ts'
import type { LiveRoute } from '../src/catalog-types.ts'

const live: LiveRoute[] = [
  {
    provider: 'deepseek-official',
    providerName: 'DeepSeek',
    model: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    selectable: true,
    source: 'api-key',
    routeRegistered: true,
    efforts: [{ id: 'high', name: 'High' }],
  },
  {
    provider: 'pi-anthropic',
    providerName: 'Claude',
    model: 'claude-sonnet-4-6',
    modelName: 'Sonnet',
    selectable: true,
    source: 'oauth',
    routeRegistered: true,
    efforts: [],
  },
]

describe('overlay', () => {
  it('treats a missing file as inherit for every role', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-overlay-missing-'))
    const current = await readOverlay(home)
    assert.equal(current.missing, true)
    assert.equal(current.overlay.roles.feature?.inherit, true)
    assert.deepEqual(current.overlay.roles.feature?.routes, [])
  })

  it('parses inherit-parent aliases and rejects extra fields', () => {
    const overlay = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: { inherit: 'auto', routes: [] },
      },
    }))
    assert.equal(overlay.roles.feature?.inherit, true)
    assert.throws(() => parseOverlay(JSON.stringify({
      version: 1,
      roles: { feature: { inherit: false, routes: [{ provider: 'x', model: 'y', extra: true }] } },
    })))
    assert.throws(() => parseOverlay(JSON.stringify({
      version: 1,
      roles: { 'not-a-role': { inherit: true, routes: [] } },
    })))
  })

  it('rejects a scalar role with two routes', () => {
    assert.throws(() => parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [
            { provider: 'deepseek-official', model: 'deepseek-chat' },
            { provider: 'pi-anthropic', model: 'claude-sonnet-4-6' },
          ],
        },
      },
    })))
  })

  it('validates routes and efforts against the live catalog', () => {
    const good = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' }],
        },
      },
    }))
    assert.deepEqual(validateOverlayAgainstCatalog(good, live), [])

    const unsigned = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'openai', model: 'gpt-4' }],
        },
      },
    }))
    assert.match(validateOverlayAgainstCatalog(unsigned, live).join('\n'), /not a logged-in live route/)

    const noEffort = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        'why-synthesizer': {
          inherit: false,
          routes: [{ provider: 'pi-anthropic', model: 'claude-sonnet-4-6', reasoningEffort: 'xhigh' }],
        },
      },
    }))
    assert.match(validateOverlayAgainstCatalog(noEffort, live).join('\n'), /has no effort field/)

    const wrongEffort = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'max' }],
        },
      },
    }))
    assert.match(validateOverlayAgainstCatalog(wrongEffort, live).join('\n'), /not accepted/)
  })

  it('round-trips a write', async () => {
    const home = await mkdtemp(join(tmpdir(), 'pstack-dsh-overlay-write-'))
    const overlay = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' }],
        },
      },
    }))
    const path = await writeOverlay(overlay, home)
    const current = await readOverlay(home)
    assert.equal(current.missing, false)
    assert.equal(current.path, path)
    assert.equal(current.overlay.roles.feature?.inherit, false)
    assert.equal(current.overlay.roles.feature?.routes[0]?.reasoningEffort, 'high')
  })
})
