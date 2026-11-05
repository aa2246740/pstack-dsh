import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSkillMarkdown } from '../src/frontmatter.ts'
import { emptyOverlay, parseOverlay } from '../src/overlay.ts'
import { parent } from './agent-fixture.ts'
import { spawnTool, type SubagentHandle } from '../src/tools.ts'
import { normalizeRole } from '../src/roles.ts'
import { resolveSpawn } from '../src/spawn.ts'

describe('frontmatter', () => {
  it('reads Windows CRLF skill files', () => {
    const parsed = parseSkillMarkdown('---\r\nname: poteto-mode\r\ndescription: test skill\r\n---\r\nBody\r\n', 'fallback')
    assert.equal(parsed?.frontmatter.name, 'poteto-mode')
    assert.equal(parsed?.frontmatter.description, 'test skill')
  })
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

describe('retired how-critics spawn', () => {
  for (const continuable of [false, true]) {
    for (const background of [undefined, false, true]) {
      it(`starts zero agents with continuable=${continuable}, background=${background}`, async () => {
        let starts = 0
        let providerLookups = 0
        const subagents: SubagentHandle = {
          async startActivation() {
            starts += 1
            throw new Error('retired role must not start a child')
          },
          resolveMaxDepth: () => 3,
          getProvider() {
            providerLookups += 1
            return {
              name: 'spawn', inheritsParentContext: false,
              capabilities: { agentOptions: true, agentPreset: true, outputSchema: true, depthLimit: true },
              ...continuable ? { prepareContinuable: async () => ({}) } : {},
            }
          },
        }
        const tool = spawnTool({ subagents })
        const result = await tool.execute({
          role: 'how-critics',
          description: 'Legacy critic request',
          prompt: 'Review this design',
          ...(background === undefined ? {} : { run_in_background: background }),
          route_index: 1,
        }, { agent: parent })
        assert.deepEqual(result, {
          kind: 'disabled',
          role: 'how-critics',
          reason: 'how-critics was retired in pstack 0.15; no agent was started.',
        })
        assert.equal(starts, 0)
        assert.equal(providerLookups, 0)
      })
    }
  }
})
