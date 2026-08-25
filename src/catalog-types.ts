export interface LiveEffort {
  readonly id: string
  readonly name: string
  readonly description?: string
}

export interface LiveRoute {
  readonly provider: string
  readonly providerName: string
  readonly model: string
  readonly modelName: string
  /** True when this route can be selected for spawn (live adapter + logged-in credential). */
  readonly selectable: boolean
  readonly source: 'api-key' | 'oauth'
  readonly oauthSignedIn?: boolean
  readonly routeRegistered: boolean
  readonly efforts: readonly LiveEffort[]
  readonly defaultEffort?: string
  readonly hint?: string
}

export interface CatalogResult {
  readonly routes: LiveRoute[]
  readonly selectableCount: number
  readonly oauthPluginPresent: boolean
  readonly oauthStorePresent: boolean
  readonly oauthSignedInProviders: string[]
  readonly overlayPath: string
  readonly overlayMissing: boolean
  readonly inheritParent: true
  readonly recommendOauthLogin: boolean
  readonly emptyReason?: string
}

export const OAUTH_ROUTE_BY_STORE_ID: Readonly<Record<string, string>> = {
  'openai-codex': 'pi-openai-codex',
  anthropic: 'pi-anthropic',
  xai: 'pi-xai',
  'github-copilot': 'pi-github-copilot',
  openrouter: 'pi-openrouter',
  'kimi-coding': 'pi-kimi-coding',
}

export function storeIdForRoute(route: string): string | undefined {
  for (const [id, mapped] of Object.entries(OAUTH_ROUTE_BY_STORE_ID)) {
    if (mapped === route) return id
  }
  return undefined
}
