import type { CatalogHost } from './catalog.ts'
import { buildCatalog } from './catalog.ts'
import type { CatalogResult } from './catalog-types.ts'
import {
  parseOverlay,
  readOverlay,
  validateOverlayAgainstCatalog,
  writeOverlay,
  type Overlay,
} from './overlay.ts'
import { resolveDshHome } from './home.ts'
import { dropUnselectableRoles } from './settings-draft.ts'

export interface SettingsSnapshot {
  catalog: CatalogResult
  overlay: Overlay
  path: string
  missing: boolean
  droppedRoles: string[]
}

export async function loadSettingsSnapshot(host: CatalogHost): Promise<SettingsSnapshot> {
  const dshHome = host.dshHome ?? resolveDshHome(host.env)
  const catalog = await buildCatalog({ ...host, dshHome })
  const current = await readOverlay(dshHome)
  const { overlay, droppedRoles } = dropUnselectableRoles(current.overlay, catalog.routes)
  return {
    catalog,
    overlay,
    path: current.path,
    missing: current.missing,
    droppedRoles,
  }
}

export async function saveSettingsOverlay(host: CatalogHost, raw: unknown): Promise<{ path: string; overlay: Overlay }> {
  const dshHome = host.dshHome ?? resolveDshHome(host.env)
  const overlay = typeof raw === 'string' ? parseOverlay(raw) : parseOverlay(JSON.stringify(raw))
  const catalog = await buildCatalog({ ...host, dshHome })
  const errors = validateOverlayAgainstCatalog(overlay, catalog.routes)
  if (errors.length > 0) {
    const error = new Error(`overlay rejected against live catalog:\n${errors.join('\n')}`)
    ;(error as Error & { errors: string[] }).errors = errors
    throw error
  }
  const path = await writeOverlay(overlay, dshHome)
  return { path, overlay }
}
