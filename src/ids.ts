/** Startup line `dshx verify-boot` looks for. */
export const BOOT_MARKER = '[my-plugins/pstack-dsh] loaded'

/** Cordis plugin / Loader row id. */
export const PLUGIN_ID = 'pstack-dsh'

/** Bundled skill provider name on `ctx.skills`. */
export const SKILL_PROVIDER_NAME = 'pstack-dsh'

/** Overlay file under `$DSH_HOME`. */
export const OVERLAY_FILENAME = 'pstack-dsh.json'

/** DSH-owned OAuth store from dsh-oauth-login. Never ~/.pi / ~/.codex / ~/.claude / grok CLI. */
export const OAUTH_AUTH_FILENAME = '.dsh-oauth-auth.json'
export const OAUTH_AUTH_LEGACY_FILENAME = '.pi-login-auth.json'

/** Official DeepSeek adapter. `packages/llm/llm-deepseek/src/index.ts` `PROVIDER`, `DEFAULT_API_KEY_ENV`. */
export const DEEPSEEK_API_KEY_ENV = 'DEEPSEEK_API_KEY'
export const DEEPSEEK_PROVIDER = 'deepseek-official'

/** Model-facing tool names this plugin registers. */
export const TOOL_CATALOG = 'pstack_catalog'
export const TOOL_SPAWN = 'pstack_spawn'
export const TOOL_OVERLAY_READ = 'pstack_overlay_read'
export const TOOL_OVERLAY_WRITE = 'pstack_overlay_write'

/** Default in-process spawn provider. `packages/bundle/base/cordis.patch.yml` `providerName: spawn`. */
export const SPAWN_PROVIDER = 'spawn'
