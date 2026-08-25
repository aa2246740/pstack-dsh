import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('bundle composition', () => {
  it('declares a web client half on settings.section, not a second config file', async () => {
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
      name: string
      exports: Record<string, unknown>
      dsh: { client: { platform: string; inject: string[] } }
    }
    assert.equal(pkg.name, 'pstack-dsh')
    assert.equal(pkg.exports['./client'], './lib/client.js')
    assert.equal(pkg.dsh.client.platform, 'web')
    assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings'))
    assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-locale'))
  })

  it('registers settings.section id pstack from the client entry', async () => {
    const source = await readFile(join(root, 'src/client/index.tsx'), 'utf8')
    assert.match(source, /export function apply/)
    assert.match(source, /export const inject = \['slots', 'locale'\]/)
    assert.doesNotMatch(source, /export\s+default\s+/)
    assert.match(source, /settings\.section/)
    assert.match(source, /SETTINGS_SECTION_ID/)
  })
})
