import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lib = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib')
const filename = ['client.cjs', 'client.js']
  .map(name => join(lib, name))
  .find(path => {
    try {
      readFileSync(path)
      return true
    } catch {
      return false
    }
  })
if (filename === undefined) throw new Error('tsdown did not emit lib/client.js or lib/client.cjs')
const source = readFileSync(filename, 'utf8')
const out = join(lib, 'client.js')
if (source.includes('window.__ModuleLoader__')) {
  if (filename !== out) writeFileSync(out, source)
} else {
  writeFileSync(out, `window.__ModuleLoader__.load({
	id: "pstack-dsh",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${source}
		return module.exports;
	}
});
`)
}
const cjs = join(lib, 'client.cjs')
if (cjs !== out) {
  try {
    unlinkSync(cjs)
  } catch {
    // no extra cjs artifact
  }
}
