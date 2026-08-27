declare module '@deepseek-ai/dsh-client-runtime/client' {
  export interface ClientContext {
    effect(fn: () => (() => void) | void, label?: string): void
    on(event: 'connection/reset', listener: () => void): () => void
    remote: import('./api.ts').CatalogEventContext['remote']
    locale: {
      register(ns: string, dicts: { zh: unknown; en: unknown }): () => void
      bind(ns: string): (key: string, params?: Record<string, unknown>) => string
    }
    slots: {
      inject(name: string, factory: () => unknown): void
      register(options: Record<string, unknown>, component: unknown): unknown
    }
  }
}

declare module '@deepseek-ai/dsh-client-ui-settings/client' {}
declare module '@deepseek-ai/dsh-client-locale/client' {}
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {}
}

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ReactNode } from 'react'
  export function Button(props: {
    variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
    size?: 'md' | 'sm'
    children?: ReactNode
  } & ButtonHTMLAttributes<HTMLButtonElement>): ReactNode
}
