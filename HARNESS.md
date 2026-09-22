# DSH harness map

This port carries pstack 0.15's 23 playbooks and 23 principles, with DSH call sites and model-invocable principles. See [UPGRADE-0.15.md](./UPGRADE-0.15.md) for the pinned upstream source and excluded runtime changes.

Sources: official pstack (`cursor/plugins` `pstack/`) and official DeepSeek Harness (`deepseek-ai/deepseek-harness`). Tool names and fields below are from DSH source, not from Cursor `Task` and not from grok-build `task`.

Sister port [pstack-grokbuild](https://github.com/aa2246740/pstack-grokbuild) is process lessons only. Do not copy its call sites.

Workbench: [dshx](https://github.com/aa2246740/dsh-external-plugin-devkit) (`dshx kb cat start-here`). Official DSH source outranks dshx. dshx is not a DSH fork and not Creator Mode.

## Verdict

**Yes. The discipline ports. Cursor and Grok runtimes do not.**

Install this repo as a DSH plugin on official DeepSeek Harness **0.1.5-rc.3** (`@deepseek-ai/dsh@0.1.5-rc.3`). `@deepseek-ai/dsh-*` peers are `^0.1.5-rc.3`. Do not write `~/.cursor/rules`. Do not invent Cursor panel slugs. Do not send grok `task` fields. Out of the box, children inherit this conversation's route. Configure roles in **Settings → pstack**. `/setup-pstack` is an optional pointer.

Official model-facing `subagent` cannot take a pstack role or a per-call model. This plugin registers `pstack_spawn`, which calls `ctx.subagents.start` / `startContinuable` on the shipped `spawn` provider and applies overlay route plus effort on the `agent/request` waterfall.
