import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'

const root = process.env.DSHX_HARNESS?.trim()
if (!root) throw new Error('Set DSHX_HARNESS to the checkout used for this build.')
const adapter = resolve(root, 'tools/dshx/src/client-build.js')
if (!existsSync(adapter)) throw new Error(`dshx client build adapter not found: ${adapter}`)
const { externalClientBundle } = await import(pathToFileURL(adapter).href)
const [, client] = externalClientBundle('pstack-dsh', ['src/index.ts'], { clientEntry: 'src/client/index.tsx' })

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    platform: 'node',
    format: 'esm',
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    dts: true,
    outDir: 'lib',
    clean: true,
    deps: {
      neverBundle: [/^@deepseek-ai\//],
    },
  },
  client,
])
