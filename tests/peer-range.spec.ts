import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const ACCEPTED = ['0.2.0-rc.1', '0.2.0']
const REJECTED = ['0.1.7-rc.2', '0.2.0-alpha.1']

describe('DSH 0.2.0-rc.1 peers', () => {
  it('accepts 0.2.0-rc.1 and 0.2.0, and rejects 0.1.7-rc.2 and 0.2.0-alpha.1', async () => {
    const manifest = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')) as {
      peerDependencies: Record<string, string>
      devDependencies: Record<string, string>
      engines?: { node?: string }
    }
    const peers = Object.entries(manifest.peerDependencies).filter(([name]) => name.startsWith('@deepseek-ai/dsh'))
    assert.ok(peers.length > 0)
    for (const [name, range] of peers) {
      assert.equal(range, '>=0.2.0-rc.1 <0.2.1', name)
      for (const version of ACCEPTED) {
        assert.equal(semver.satisfies(version, range), true, `${name} must accept ${version}`)
      }
      for (const version of REJECTED) {
        assert.equal(semver.satisfies(version, range), false, `${name} must reject ${version}`)
      }
      assert.equal(manifest.devDependencies[name], '0.2.0-rc.1', name)
    }
    assert.equal(manifest.devDependencies['@deepseek-ai/cordis'], '4.0.4')
    assert.equal(manifest.engines?.node, '^22.19.0 || >=24')
  })
})
