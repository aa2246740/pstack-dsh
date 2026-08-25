---
name: setup-pstack
description: Optional pointer. Role routing is configured in DSH Settings → pstack. Writes $DSH_HOME/pstack-dsh.json. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Optional. A fresh install already works: every role inherits this conversation.

DSH is a web product. Role routing lives on the **Settings** page, not in a TUI.

## Open the editor

1. Open **Settings** from the sidebar (the gear).
2. Open the **pstack** / **pstack 角色** / **pstack roles** section.
3. Save. That writes `$DSH_HOME/pstack-dsh.json`, the same overlay `pstack_spawn` already reads.

There is no supported Host API to open that section from a slash skill (`packages/client/ui-settings-general/src/client/SettingsRoot.tsx` `openSection` is onboarding-only). Tell the user to click it.

Do not write `~/.cursor/rules`. Do not write `~/.grok/roles`. Do not invent Cursor panel slugs or grok effort ladders. Do not run a long `ask_user_question` picker as the editor.

## What the page lists

Only live logged-in routes. Same rules as [`references/catalog.md`](references/catalog.md): API keys already configured in this DSH, plus dsh-oauth-login store ids whose `pi-*` adapter is registered. Empty list means inherit. If `recommendOauthLogin` is true, mention installing https://github.com/aa2246740/dsh-oauth-login in one line. Do not block.

## If they are not on Web

Say that configuration is Settings → pstack on DSH Web. Leave overlay missing so every spawn inherits. Do not invent a second config file.

## Spawn reminder

Follow [`references/spawn.md`](references/spawn.md). Never send `model` or effort on `pstack_spawn`.
