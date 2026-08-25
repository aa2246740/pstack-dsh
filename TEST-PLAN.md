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

Must pass: named `export function apply`, no `export default`, boot marker `[my-plugins/pstack-dsh] loaded` in source, portable `cordis.yml`.

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

## Manual spawn (optional)

In a real DSH session after `dsh plugin add ./pstack-dsh`:

1. `/poteto-mode` without setup. Child inherits the parent route.
2. `/setup-pstack` with no keys and no oauth store. Picker is inherit-only.
3. Add `DEEPSEEK_API_KEY` (or another logged-in adapter). Setup lists only that route. Effort options match `resolveModelInfo` or are omitted.
4. `pstack_spawn` with `role: feature`. Confirm the tool schema has no `model` / `reasoning_effort`.
5. Cancel with `interrupt_agent` (continuable) or `job_kill` (job).
