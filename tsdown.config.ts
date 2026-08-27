import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'

// Resolve the external build adapter without committing a machine-specific path.
function resolveHarness(): string {
  const candidates: string[] = []
  const fromEnv = process.env.DSHX_HARNESS?.trim()
  if (fromEnv) candidates.push(fromEnv)
  const configured = join(homedir(), '.config', 'dshx', 'harness')
  if (existsSync(configured)) {
    const value = readFileSync(configured, 'utf8').trim()
    if (value) candidates.push(value)
  }
  const isHarness = (root: string) => existsSync(join(root, 'apps/cli/src/bin.ts'))
    && existsSync(join(root, 'tools/dshx/src/cli.ts'))
  for (let root = process.cwd(); ; root = dirname(root)) {
    if (isHarness(root)) { candidates.push(root); break }
    if (dirname(root) === root) break
  }
  const roots = new Set(candidates.map(candidate => {
    const root = resolve(candidate)
    if (!isHarness(root)) throw new Error(`Not a DSHX Harness checkout: ${root}`)
    return realpathSync(root)
  }))
  if (roots.size !== 1) {
    throw new Error('Configure one matching DSHX_HARNESS / ~/.config/dshx/harness checkout before building pstack.')
  }
  return [...roots][0]!
}

const { externalClientBundle } = await import(pathToFileURL(join(resolveHarness(), 'tools/dshx/src/client-build.js')).href)
const [, client] = externalClientBundle('pstack-dsh', ['src/index.ts'], { clientEntry: 'src/client/index.tsx' })

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    platform: 'node',
    format: 'esm',
    dts: true,
    outDir: 'lib',
    clean: true,
    deps: {
      neverBundle: [/^@deepseek-ai\//],
    },
  },
  client,
])
