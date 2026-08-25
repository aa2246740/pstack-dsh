import type { CatalogResult } from '../catalog-types.ts'
import type { Overlay } from '../overlay-model.ts'
import { SETTINGS_SAVE_PATH, SETTINGS_SNAPSHOT_PATH } from '../ids.ts'

export interface SettingsSnapshot {
  catalog: CatalogResult
  overlay: Overlay
  path: string
  missing: boolean
  droppedRoles: string[]
}

async function jsonRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { accept: 'application/json', ...body === undefined ? {} : { 'content-type': 'application/json' } },
    credentials: 'same-origin',
    ...body === undefined ? {} : { body: JSON.stringify(body) },
  })
  const value: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = typeof value === 'object' && value !== null && 'error' in value && typeof (value as { error: unknown }).error === 'string'
      ? (value as { error: string }).error
      : `HTTP ${response.status}`
    throw new Error(message)
  }
  return value as T
}

export function loadSettingsSnapshot(): Promise<SettingsSnapshot> {
  return jsonRequest<SettingsSnapshot>(SETTINGS_SNAPSHOT_PATH, 'GET')
}

export function saveSettingsOverlay(overlay: Overlay): Promise<{ path: string; overlay: Overlay }> {
  return jsonRequest<{ path: string; overlay: Overlay }>(SETTINGS_SAVE_PATH, 'PUT', { overlay })
}
