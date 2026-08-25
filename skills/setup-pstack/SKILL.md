---
name: setup-pstack
description: Optional. Map pstack roles onto live DSH routes and, only when that route accepts it, adapter-owned effort. Detects logged-in API keys and dsh-oauth-login store routes. Writes $DSH_HOME/pstack-dsh.json. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Optional, global, once. A fresh install already works: every role inherits this conversation. This skill writes `$DSH_HOME/pstack-dsh.json` so later `pstack_spawn` calls can pin a logged-in route per role.

Do not write `~/.cursor/rules`. Do not write `~/.grok/roles`. Do not invent Cursor panel slugs or grok effort ladders.

Follow [`references/catalog.md`](references/catalog.md) and [`references/spawn.md`](references/spawn.md).

## Ask the human

This section is the only source for `ask_user_question`. Copy the option shape. Do not invent options.

Every option `label` and `description` may use: `inherit-parent`, `auto`, live catalog `provider/model` pairs, live `efforts[].id` tokens for the route already chosen, pstack role keys, and plain words that explain those choices. Nothing else. Do not put an effort id in the TUI that this route's `resolveModelInfo` did not list. Do not offer `max`, `xhigh`, or Cursor slugs unless that exact string is on **this** route.

### Models

Call `pstack_catalog`. First question options, in this order, and no others:

1. `inherit-parent` for every role (Recommended). Children use this chat's route.
2. One option per **selectable** catalog route. That route for every role. Label is `provider/model` from the catalog, not a guessed slug.
3. Customize per role. Only if `selectableCount >= 1`.

If `selectableCount === 0`, skip 2 and 3. Keep inherit-parent. In the chat (not as extra TUI options) say: add a provider API key in DSH, or install and login https://github.com/aa2246740/dsh-oauth-login. If `recommendOauthLogin` is true, that oauth line is required. Do not block.

If they pick customize: follow-up questions, one role at a time or grouped. Each role's options are only `inherit-parent`, `auto`, and each selectable `provider/model`.

Panel roles (`how-critics`, `arena-runners`, `arena-cross-judge-pool`, `architect-runners`, `interrogate-reviewers`) are arrays. Inherit means one inherit entry. Customize may add more **selectable** routes. One `pstack_spawn` per entry, `route_index` matching the list.

`swarm-workers` is the default route for every `/swarm` worker unless a race assigns another **selectable** route per arm. A race still cannot name a slug that is not in this catalog.

### Effort

Only after models. Only for roles whose chosen route has `efforts.length > 0`.

For each such route, options are `inherit-parent` (omit `reasoningEffort`) plus each `efforts[].id` for **that** route. If two roles picked two routes, do not mix their effort enums.

If the route has no effort field, skip the question for that role. Write the overlay route with no `reasoningEffort` key.

Do not copy grok `xhigh/high/medium/low`. Do not copy Cursor `max`. Do not invent `ultra`.

## Steps

### 1. Detect live routes

Call `pstack_catalog`. That tool reads registered adapters, key presence, and the oauth store. Do not hand-write a model list. Do not probe Cursor. Do not run grok CLI.

Never write a provider/model pair that is not `selectable: true` in that result. `inherit-parent` and `auto` are always valid and are not slugs.

### 2. Load current state

Call `pstack_overlay_read`. Missing file means every role inherits. Stale overlay entries that are no longer selectable must be re-chosen or reset to inherit.

### 3. Map and confirm

Show every role with its current assignment. Ask with `ask_user_question` using only the options above.

### 4. Validate

Build `{ version: 1, roles: { <role>: { inherit: true, routes: [] } | { inherit: false, routes: [{ provider, model, reasoningEffort? }] } } }`. Scalar roles: at most one route. Panel roles: one route per spawn.

Call `pstack_overlay_write`. If it rejects, the catalog moved; re-detect and ask again. Do not write the file yourself.

### 5. Confirm

Tell the user the overlay path. New `pstack_spawn` calls pick it up in this session. Re-running this skill overwrites the file.

### 6. Offer a verification skill (optional)

If the project has no way to drive the real app, offer once: generate one with `/create-verification-skill`. On no, move on.
