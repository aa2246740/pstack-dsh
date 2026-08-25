declare module '@deepseek-ai/cordis' {
  export class Context {
    tools: { register(tool: unknown): unknown }
    skills: { registerProvider(factory: () => unknown): unknown }
    get<T = unknown>(name: string): T | undefined
    on(event: string, listener: (...args: never[]) => unknown): unknown
    inject(deps: string[], callback: (ctx: Context) => void): unknown
    effect(callback: () => (() => void) | (() => Promise<void>) | void, label?: string): unknown
    webServer?: {
      register(route: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>
      }): () => void
    }
    logger?: { info?(message: string): void; error?(message: unknown): void }
  }
}

declare module '@deepseek-ai/dsh-tools' {
  export function defineTool(definition: {
    name: string
    description: string
    parameters: Record<string, unknown>
    execute: (args: Record<string, unknown>, exec: { signal?: AbortSignal; agent?: { id: string } }) => Promise<unknown>
  }): unknown
}
