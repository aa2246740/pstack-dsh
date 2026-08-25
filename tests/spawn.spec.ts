import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSkillMarkdown } from '../src/frontmatter.ts'
import { emptyOverlay, parseOverlay } from '../src/overlay.ts'
import { applyRoleConfig } from '../src/request-overlay.ts'
import { normalizeRole } from '../src/roles.ts'
import { resolveSpawn } from '../src/spawn.ts'

describe('frontmatter', () => {
  it('maps Poteto Mode to kebab-case poteto-mode', () => {
    const parsed = parseSkillMarkdown(
      '---\nname: Poteto Mode\ndescription: poteto style\ndisable-model-invocation: true\n---\n\nBody\n',
      'poteto-mode',
    )
    assert.equal(parsed?.frontmatter.name, 'poteto-mode')
    assert.equal(parsed?.frontmatter.modelInvocable, false)
    assert.equal(parsed?.frontmatter.userInvocable, true)
  })

  it('drops a name that is not kebab-case', () => {
    const parsed = parseSkillMarkdown(
      '---\nname: Not Valid Name\ndescription: x\n---\n\nBody\n',
      'fallback',
    )
    assert.equal(parsed, undefined)
  })
})

describe('resolveSpawn', () => {
  it('inherits when the overlay is missing a mapping', () => {
    const resolved = resolveSpawn(emptyOverlay(), {
      role: 'feature',
      description: 'build flag',
      prompt: 'add --json',
      runInBackground: true,
    })
    assert.equal(resolved.inherit, true)
    assert.equal(resolved.agentOptions, undefined)
    assert.equal(resolved.reasoningEffort, undefined)
  })

  it('maps a logged-in route without putting effort on the spawn schema', () => {
    const overlay = parseOverlay(JSON.stringify({
      version: 1,
      roles: {
        feature: {
          inherit: false,
          routes: [{ provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' }],
        },
      },
    }))
    const resolved = resolveSpawn(overlay, {
      role: 'generalPurpose',
      description: 'ad hoc',
      prompt: 'help',
      runInBackground: true,
    })
    assert.equal(normalizeRole('generalPurpose'), 'poteto-agent')
    assert.equal(resolved.role, 'poteto-agent')
    assert.equal(resolved.inherit, true)

    const feature = resolveSpawn(overlay, {
      role: 'feature',
      description: 'build flag',
      prompt: 'add --json',
      runInBackground: true,
    })
    assert.equal(feature.inherit, false)
    assert.deepEqual(feature.agentOptions, { provider: 'deepseek-official', model: 'deepseek-chat' })
    assert.equal(feature.reasoningEffort, 'high')
  })
})

describe('applyRoleConfig', () => {
  it('overlays effort onto LlmCallConfig, not onto a spawn field', () => {
    const next = applyRoleConfig(
      { provider: 'parent', model: 'parent-model' },
      { provider: 'deepseek-official', model: 'deepseek-chat', reasoningEffort: 'high' },
    )
    assert.equal(next.provider, 'deepseek-official')
    assert.equal(next.model, 'deepseek-chat')
    assert.equal(next.reasoningEffort, 'high')
  })
})
