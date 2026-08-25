# Test plan

Cola does not have to be the guinea pig. Run these against a local DSH checkout plus dshx.

## Static

```bash
npm install
npm test
npm run typecheck
```

`tests/static-call-sites.spec.ts` greps skills and docs for harness leftovers:

- Cursor `AskQuestion`, `TodoWrite`, `~/.cursor/rules`
- Cursor panel slugs (`claude-fable-5-thinking-max`, `gpt-5.6-sol-max`, `grok-4.6-fast-xhigh`, `claude-opus-5-thinking-xhigh`)
- `subagent_type`, grok `get_task_output`, grok `scheduler_create`
- spawn docs sending `reasoning_effort` / `thinking`
- `cursor-team-kit`, `/deslop` as a required control skill

## dshx check

From a machine with [dshx](https://github.com/aa2246740/dsh-external-plugin-devkit) and a DSH checkout:

```bash
dshx setup --harness /path/to/deepseek-harness
# link this repo as my-plugins/pstack-dsh if it is not already
dshx check pstack-dsh --harness /path/to/deepseek-harness
```

Must pass: named `export function apply`, no `export default`, boot marker `[my-plugins/pstack-dsh] loaded` in source, portable `cordis.yml`, `dsh.client` + lazy-CJS `lib/client.js` (`window.__ModuleLoader__.load`).

## verify-boot (isolated cold boot)

```bash
dshx status          # if a live Host is already supervised, skip this section
dshx verify-boot pstack-dsh --port 43123
```

Never `--force`. Never stop a Host this command did not start.

This cloud checkout ran `dshx check` green. `dshx verify-boot pstack-dsh --port 43123` then skipped isolated cold boot: the linked official DSH tree had no installed CLI (`dump-config exited 1`, `id pstack-dsh missing from dump-config`). No Host was started or stopped. Re-run verify-boot on a machine where `dsh` dumps config.

## Catalog / overlay (no network models required)

`tests/catalog.spec.ts` and `tests/overlay.spec.ts` cover:

- empty host → `selectableCount === 0`, `inheritParent: true`, oauth recommend line
- API-key route only when `credentials.describe` says configured
- unsigned vendor ids are not listed
- overlay write rejects a route that is not selectable
- overlay write rejects `reasoningEffort` when that route has no efforts
- overlay write rejects an effort id the live adapter did not list
- missing overlay file → every role inherits
- Settings snapshot/save uses the same overlay path and rejects unsigned slugs (`tests/settings-api.spec.ts`, `tests/settings-draft.spec.ts`)

## Manual Settings (EDITH / local DSH Web)

After `dsh plugin add ./pstack-dsh` and a **page reload**:

1. Open Settings (sidebar gear) → **pstack** / **pstack 角色**.
2. With no keys and no oauth store: inherit-only, oauth recommend line, Save still writes inherit overlay.
3. Add `DEEPSEEK_API_KEY` (or another logged-in adapter). Reload the page. The page lists only that route. Effort options match `resolveModelInfo` or are omitted.
4. Save. `$DSH_HOME/pstack-dsh.json` matches the form. `pstack_spawn` does not grow `model` / `reasoning_effort` fields.
5. `/setup-pstack` only points at Settings → pstack. It does not run a TUI picker.
