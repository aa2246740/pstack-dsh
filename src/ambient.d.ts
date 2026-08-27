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
  export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

  export function defineTool(definition: {
    name: string
    description: string
    parameters: Record<string, unknown>
    output: {
      schema: { type: string }
      render: (args: unknown, value: JsonValue) => unknown[]
    }
    execute: (args: Record<string, unknown>, exec: { signal?: AbortSignal; agent?: { id: string } }) => Promise<JsonValue>
  }): unknown
}
