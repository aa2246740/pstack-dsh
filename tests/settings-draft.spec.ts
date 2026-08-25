import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyInheritAll,
  applyRouteToAll,
  draftToOverlay,
  dropUnselectableRoles,
  overlayToDraft,
  parseRouteSelectValue,
  routeSelectValue,
} from '../src/settings-draft.ts'
import { emptyOverlay, parseOverlay } from '../src/overlay-model.ts'
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

describe('settings draft', () => {
  it('round-trips inherit overlay', () => {
    const overlay = emptyOverlay()
    const drafts = overlayToDraft(overlay)
    assert.equal(drafts.every(draft => draft.inherit), true)
    assert.equal(draftToOverlay(drafts).roles.feature?.inherit, true)
  })

  it('maps inherit-parent and auto to inherit, not slugs', () => {
    assert.deepEqual(parseRouteSelectValue('inherit-parent', live), {
      inherit: true,
      inheritChoice: 'inherit-parent',
    })
    assert.deepEqual(parseRouteSelectValue('auto', live), {
      inherit: true,
      inheritChoice: 'auto',
    })
    const route = parseRouteSelectValue('deepseek-official::deepseek-chat', live)
    assert.equal(route.inherit, false)
    if (!route.inherit) {
      assert.equal(route.route.provider, 'deepseek-official')
      assert.equal(route.route.model, 'deepseek-chat')
    }
    assert.equal(parseRouteSelectValue('openai::gpt-4', live).inherit, true)
  })

  it('drops unselectable overlay rows instead of inventing slugs', () => {
    const overlay = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'openai', model: 'gpt-4', reasoningEffort: 'max' }],
        },
      },
    }))
    const result = dropUnselectableRoles(overlay, live)
    assert.deepEqual(result.droppedRoles, ['feature'])
    assert.equal(result.overlay.roles.feature?.inherit, true)
  })

  it('strips effort the live adapter does not list', () => {
    const overlay = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'max' }],
        },
      },
    }))
    const result = dropUnselectableRoles(overlay, live)
    assert.equal(result.overlay.roles.feature?.routes[0]?.reasoningEffort, undefined)
    assert.equal(result.overlay.roles.feature?.routes[0]?.provider, 'deepseek-official')
  })

  it('applies one logged-in route to every role including panels', () => {
    const drafts = applyRouteToAll(
      overlayToDraft(emptyOverlay()),
      { provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' },
      live,
    )
    const overlay = draftToOverlay(drafts)
    assert.equal(overlay.roles.feature?.inherit, false)
    assert.equal(overlay.roles['how-critics']?.routes.length, 1)
    assert.equal(overlay.roles.feature?.routes[0]?.reasoningEffort, 'high')
    const noEffort = applyRouteToAll(
      overlayToDraft(emptyOverlay()),
      { provider: 'pi-anthropic', model: 'claude-sonnet-4-6', reasoningEffort: 'xhigh' },
      live,
    )
    assert.equal(draftToOverlay(noEffort).roles.feature?.routes[0]?.reasoningEffort, undefined)
  })

  it('reset-all restores inherit-parent', () => {
    const mapped = applyRouteToAll(
      overlayToDraft(emptyOverlay()),
      { provider: 'deepseek-official', model: 'deepseek-chat' },
      live,
    )
    const reset = applyInheritAll(mapped)
    assert.equal(routeSelectValue(reset.find(draft => draft.role === 'feature')!), 'inherit-parent')
    assert.equal(draftToOverlay(reset).roles.feature?.inherit, true)
  })
})
