import { defineConfig } from 'tsdown'

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
  {
    entry: { client: 'src/client/index.tsx' },
    platform: 'browser',
    format: 'cjs',
    dts: false,
    outDir: 'lib',
    clean: false,
    deps: {
      neverBundle: [
        'react',
        'react/jsx-runtime',
        '@deepseek-ai/dsh-client-ui-primitives',
      ],
    },
  },
])
