import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { OVERLAY_FILENAME } from './ids.ts'
import { resolveDshHome } from './home.ts'
import { emptyOverlay, parseOverlay, type Overlay } from './overlay-model.ts'

export {
  OVERLAY_VERSION,
  emptyOverlay,
  parseOverlay,
  routeKey,
  resolveRole,
  validateOverlayAgainstCatalog,
} from './overlay-model.ts'
export type { Overlay, OverlayRole, OverlayRoute } from './overlay-model.ts'

export function overlayPath(dshHome = resolveDshHome()): string {
  return join(dshHome, OVERLAY_FILENAME)
}

export async function readOverlay(dshHome = resolveDshHome()): Promise<{ path: string; overlay: Overlay; missing: boolean }> {
  const path = overlayPath(dshHome)
  try {
    const text = await readFile(path, 'utf8')
    return { path, overlay: parseOverlay(text), missing: false }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { path, overlay: emptyOverlay(), missing: true }
    }
    throw error
  }
}

export async function writeOverlay(overlay: Overlay, dshHome = resolveDshHome()): Promise<string> {
  const path = overlayPath(dshHome)
  await mkdir(dirname(path), { recursive: true })
  const body = `${JSON.stringify(overlay, null, 2)}\n`
  await writeFile(path, body, { encoding: 'utf8', mode: 0o600 })
  return path
}
