/** Browser half: pstack roles inside official DSH Settings. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { PstackSettings } from './PstackSettings.tsx'
import type { PstackSettingsInjected } from './PstackSettings.tsx'
import { en, zh } from './locales.ts'
import type { PstackSettingsKey } from './locales.ts'
import { SETTINGS_SECTION_ID } from '../ids.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.pstack': PstackSettingsKey
  }
}

export const name = 'pstack-dsh-client'
export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  const namespace = 'settings.pstack'
  ctx.effect(() => ctx.locale.register(namespace, { zh, en }), 'pstack-dsh: settings copy')
  const t = ctx.locale.bind(namespace) as PstackSettingsInjected['t']
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: SETTINGS_SECTION_ID,
    order: 16,
    label: () => t('nav'),
    inject: (): PstackSettingsInjected => ({ t }),
  }, PstackSettings))
}
