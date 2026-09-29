# Cloud agent rules

These rules are mandatory for every Cloud Agent turn in this repository.

## Model

- Never launch subagents (Task / explore / browser / computerUse / video) with other models. Only use grok 4.7.
- Never select Claude/GPT/Gemini; stay on the parent Grok model only.
- Do not spawn Task / computerUse / browser unless I explicitly ask. If a subagent is required, do not pass a model argument; inherit the parent model.
- Never use Claude, Sonnet, Opus, GPT, or Gemini. Prefer Grok or Composer only.

## Hooks

`.cursor/hooks.json` and the executable `.cursor/hooks/block-other-models.sh` deny Claude/Sonnet/Opus/computerUse/browser at `subagentStart`.

`.cursor/agents/worker.md` is the default implementation worker (`model: inherit`). Do not spawn further subagents.
