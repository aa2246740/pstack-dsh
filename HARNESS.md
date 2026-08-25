# DSH harness map

pstack's 22 playbooks and 21 principles stay. Only harness call sites change.

Sources: official pstack (`cursor/plugins` `pstack/`) and official DeepSeek Harness (`deepseek-ai/deepseek-harness`). Tool names and fields below are from DSH source, not from Cursor `Task` and not from grok-build `task`.

Sister port [pstack-grokbuild](https://github.com/aa2246740/pstack-grokbuild) is process lessons only. Do not copy its call sites.

Workbench: [dshx](https://github.com/aa2246740/dsh-external-plugin-devkit) (`dshx kb cat start-here`). Official DSH source outranks dshx. dshx is not a DSH fork and not Creator Mode.

## Verdict

**Yes. The discipline ports. Cursor and Grok runtimes do not.**

Install this repo as a DSH plugin. Do not write `~/.cursor/rules`. Do not invent Cursor panel slugs. Do not send grok `task` fields. Out of the box, children inherit this conversation's route. `/setup-pstack` is optional.

Official model-facing `subagent` cannot take a pstack role or a per-call model. This plugin registers `pstack_spawn`, which calls `ctx.subagents.start` / `startContinuable` on the shipped `spawn` provider and applies overlay route plus effort on the `agent/request` waterfall.

## Mapping: pstack need → DSH API

| pstack need | DSH API | Source |
|---|---|---|
| Slash skill / poteto-mode | `ctx.skills` provider + `dsh-tool-skill` `skill` tool. User `/name` injection. Frontmatter: kebab-case `name`, `description`, optional `whenToUse`, `disable-model-invocation`, `user-invocable`. `name: Poteto Mode` is invalid; this port uses `poteto-mode`. | `packages/skill/tool-skill/README.md`; `docs/subsystems/skills.md`; `packages/skill/skill-filesystem/README.md`; `packages/skill/skill/src/index.ts` `SKILL_NAME` `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |
| Plugin install | npm bundle `dsh.bundle.patch` → `dsh plugin add` | `docs/user/develop/basic/publish.md` |
| Spawn child | Model-facing official tool **`subagent`**: only `description`, `prompt`, `run_in_background`. No model, effort, isolation, `subagent_type`. This plugin's **`pstack_spawn`**: those three plus `role` and optional `route_index`. Internally `ctx.subagents.start('spawn', …)` / `startContinuable`. | `docs/tool-catalog.md` `#deepseek-aidsh-tool-subagent`; `packages/subagent/tool-subagent/src/index.ts`; `packages/bundle/base/cordis.patch.yml` `providerName: spawn`, `toolName: subagent`, `backgroundMode: continuable` |
| Per-child model | `AgentOptions` `{ provider?, model?, maxTokens? }` on `SubagentStartRequest.agentOptions`. Not a model-facing `subagent` field. "Another model requires another named tool instance" unless a plugin sets `agentOptions` at start. Overlay maps a logged-in route onto that object. Omit it to inherit the parent. | `packages/core/agent/src/runtime-types.ts` `AgentOptions`; `packages/subagent/subagent/src/types.ts` `SubagentStartRequest.agentOptions`; `packages/subagent/tool-subagent/README.md` Config `agentOptions` |
| Per-role reasoning effort | **Not on `subagent`.** `LlmCallConfig.reasoningEffort` via the `agent/request` waterfall. Adapter-owned via `resolveModelInfo().reasoning.efforts`. Empty efforts: omit. Never copy grok `xhigh/high/medium/low` or Cursor `max` unless that exact id is on **this** route. | `packages/llm/llm/src/call-config.ts` `LlmCallConfig`; `packages/llm/llm/src/types.ts` `LlmModelReasoningInfo`; `packages/core/agent/src/runtime-types.ts` `'agent/request'`; `packages/llm/llm/src/index.ts` `resolveModelInfo` rejects invalid effort metadata |
| Wait | Continuable: settlement notice + `send_message`. One-shot background: `job_output`. Foreground: the tool awaits `run.result`. | tool-subagent README; `docs/tool-catalog.md` jobs / subagent-control |
| Cancel | Continuable: `interrupt_agent`. Jobs: `job_kill`. | `docs/tool-catalog.md` `#deepseek-aidsh-tool-subagent-control`, `#deepseek-aidsh-tool-jobs` |
| Isolation / worktree / Cursor cloud | **No field** on `subagent`. Spawn-in-process inherits parent cwd. Drop `environment: "cloud"`. Parent may `git worktree add` and put the path in the prompt. | `packages/subagent/subagent-spawn-in-process/README.md` |
| Nested spawn | Default `maxDepth` **3** (tool-subagent Config). Playbooks that used nested Cursor Task + worktree still prefer parent-owned fan-out so isolation stays in the prompt. | `packages/subagent/tool-subagent/src/index.ts` `maxDepth` default `3` |
| Todo | `todo_write({ todos: [{ content, status }] })` wholesale replace. Status: `pending` \| `in_progress` \| `completed`. **No** `id`, `merge`, `cancelled`. | `packages/todo/tool-todo/README.md` |
| Ask human | `ask_user_question` | `packages/interaction/tool-ask-user/README.md` |
| Overnight /loop | **No** grok `scheduler_create`. Closest shipped tools: `create_goal` / `update_goal` (`dsh-tool-goal`). If those tools are absent, keep iterating in this chat; do not invent a scheduler. | `docs/tool-catalog.md` `#deepseek-aidsh-tool-goal` |
| Credentials (presence only) | `ctx.credentials.describe(ref)` → `{ configured }` never the value | `packages/credentials/credentials/README.md` |
| DSH home | `$DSH_HOME`, else `~/.dsh` | `packages/util/home-paths/README.md` |
| DeepSeek default key ref | `DEEPSEEK_API_KEY` on provider `deepseek-official` | `packages/llm/llm-deepseek/src/index.ts` `DEFAULT_API_KEY_ENV`, `PROVIDER` |
| OAuth store (peer, not required) | `$DSH_HOME/.dsh-oauth-auth.json` (legacy `.pi-login-auth.json`). Map store ids → `pi-*` routes from [dsh-oauth-login](https://github.com/aa2246740/dsh-oauth-login). Do not read `~/.pi`, `~/.codex`, `~/.claude`, grok CLI login. | dsh-oauth-login `src/ids.ts`, `src/catalog.ts` |
| Independent verify | Parent `pstack_spawn` `role: independent-verifier`. Second opinion is a different logged-in route when overlay mapped one; otherwise inherit. The verifier does not write the diff. | this file |
| `cursor-team-kit` (`deslop`, `control-ui`, `control-cli`) | Not shipped. `/unslop` and `/no-comments` remain. Drive the real app (browser, CLI, tests). | official pstack README "not shipped here" |
| Benny automations | Cursor automation pack. Left under `automations/` as source, not a DSH runtime. | pstack `automations/` |
| Graphite `gt` | Optional if `gt` is on PATH. Otherwise `gh` + git. | playbooks |

## Official `subagent` fields the model may send

From `docs/tool-catalog.md` `#deepseek-aidsh-tool-subagent` (generated from a booted plugin, not a guess):

- `description` (string, required)
- `prompt` (string, required)
- `run_in_background` (boolean, optional)

Do not send `model`, `provider`, `reasoning_effort`, `thinking`, `isolation`, `subagent_type`, `environment`, `readonly`, `resume_from`. They are not on this schema.

Shipped `subagent` is continuable and defaults omitted `run_in_background` to background. Shipped `subagent_fork` is one-shot and defaults to foreground. This plugin talks to `spawn`, not `fork`.

## Default spawn shape

Parent session only:

```text
pstack_spawn
  description: <3-5 words>
  prompt: <full brief, file pointers not inlined dumps>
  role: <pstack role key, e.g. feature | how-explainer | independent-verifier | poteto-agent | comment-sicko>
  run_in_background: true
  route_index: <only for panel roles when overlay has more than one route; default 0>
```

Do not send model or effort on that call. Route and effort come from `$DSH_HOME/pstack-dsh.json` when that role is mapped to a live logged-in route; otherwise the child inherits this conversation.

If `pstack_spawn` is missing, fall back to official `subagent` with only `description`, `prompt`, `run_in_background`. That path inherits the parent and cannot apply the overlay.

Then wait on the settlement notice (continuable) or `job_output` (one-shot). Cancel with `interrupt_agent` or `job_kill`.

Code-writing delegates: the playbook role key (`feature`, `bug-fix`, …). Ad-hoc helpers with no role key: `poteto-agent`. `/no-comments`: `comment-sicko`. Independent verify: `independent-verifier`.

## Effort home (hypothesis, labeled)

**Store:** `$DSH_HOME/pstack-dsh.json` `roles.<key>.routes[].reasoningEffort`, only when `resolveModelInfo(provider, model).reasoning.efforts` lists that id.

**Apply:** `ctx.on('agent/request', …)` replaces `LlmCallConfig` for the child session id remembered at spawn. `AgentOptions` has no effort field, so spawn-time `agentOptions` can set provider/model only.

If a future DSH build stops firing host-level `agent/request` for in-process children, inherit-parent still works; mapped effort would not. Do not invent a spawn-tool field to paper over that.

## What `/setup-pstack` may list

Only:

1. Registered `ctx.llm` adapters whose API key `credentials.describe(ref).configured` is true (settings `apiKeyEnv` walk, plus `DEEPSEEK_API_KEY` for `deepseek-official`).
2. Routes already in the dsh-oauth-login store **and** registered as `pi-*` adapters.

Empty catalog: inherit parent. Tell the user to add a key or install/login [dsh-oauth-login](https://github.com/aa2246740/dsh-oauth-login). Do not block. Do not show a vendor catalog.

## What this port dropped

| Cursor / Grok field | Why dropped |
|---|---|
| `Task.model` / Cursor panel slugs | Not on DSH `subagent`. Never invent slugs. |
| `Task.subagent_type` | DSH has no such field. Role is `pstack_spawn.role`. |
| `Task.isolation` / `environment: "cloud"` | No isolation field. Parent worktree + path in prompt. |
| grok `task.reasoning_effort` | Not on grok `task` either; also not on DSH `subagent`. |
| grok `~/.grok/roles` | DSH does not use that tree. Overlay is `$DSH_HOME/pstack-dsh.json`. |
| Cursor `~/.cursor/rules/pstack-models.mdc` | Cursor-only. |
| grok `scheduler_create` / Cursor `/loop` | Not in DSH. Use `create_goal` when present. |
| grok `get_task_output` | DSH settlement notice / `job_output`. |
| Cursor `AskQuestion` / `TodoWrite` | DSH `ask_user_question` / `todo_write`. |
