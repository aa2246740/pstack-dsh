import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const HARNESS = '0.2.0-rc.2'
const ALPHAS = ['0.2.0-alpha.1', '0.2.0-alpha.2']

describe('DSH 0.2.0-rc.2 peers', () => {
  it('accepts 0.2.0-rc.2 and rejects 0.2.0 alphas', async () => {
    const manifest = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')) as {
      peerDependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const peers = Object.entries(manifest.peerDependencies).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
    assert.ok(peers.length > 0)
    for (const [name, range] of peers) {
      assert.equal(range, '>=0.2.0-rc.1 <0.2.1', name)
      assert.equal(semver.satisfies(HARNESS, range), true, `${name} must accept ${HARNESS}`)
      assert.equal(semver.satisfies(HARNESS, '^0.1.2-rc.1'), false)
      for (const alpha of ALPHAS) {
        assert.equal(semver.satisfies(alpha, range), false, `${name} must reject ${alpha}`)
      }
      assert.match(manifest.devDependencies[name], /^0\.2\.0-rc\.[12]$/, name)
    }
  })
})
