# Set up pstack

In this page you install the plugin, pick which models pstack uses, and run your first task. Setup is one command, then the Settings page if you want per-role routes.

## Install the plugin

Need **pnpm** on `PATH`. Then:

```sh
dsh plugin --profile web add github:aa2246740/pstack-dsh
```

Restart that Host and reload the page. Add writes `$DSH_HOME/profiles/web`; it does not hot-load a running process.

## Pick your models

Open **Settings** (sidebar gear) → **pstack** (nav **pstack 角色** / **pstack roles**).

The page lists only logged-in DSH routes. Save writes `$DSH_HOME/pstack-dsh.json`. A missing file means every role inherits this conversation.

You only override what you care about. A role left as `inherit-parent` keeps the parent route. `auto` means the same inherit. For a panel role the value is a list, and one subagent runs per entry. Setup also configures `swarm-workers`, the default route for every `/swarm` worker unless a race names a selectable catalog route for each arm.

[`/setup-pstack`](../../skills/setup-pstack/SKILL.md) is a pointer to that page. It is not a TUI editor.

If the project has no way to prove app behavior, you can generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md). [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

New `pstack_spawn` calls pick up the overlay in this session.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/poteto-mode` is sticky. It stays on for the conversation until you opt out by saying so.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
