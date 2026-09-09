---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model without annotating the source code.

## Step 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple**, a single module, small utility, or narrow question such as "how does function X work". No explorers. One explainer explores and explains in a single pass. Go to Step 2b.
- **Complex**, a subsystem spanning multiple files or services, a cross-cutting feature, or a full architectural overview. Spawn parallel explorers first, then hand off to the explainer. Go to Step 2a.

When in doubt, take the simple path.

## Step 2a. Explore, complex questions only

Decompose the question into 2 to 4 exploration angles, each a distinct slice of the subsystem.

Spawn all explorers in a single message with `pstack_spawn` (`role: how-explorer`, `run_in_background: true`). Follow [`../setup-pstack/references/spawn.md`](../setup-pstack/references/spawn.md). Do not send `model`. Overlay maps the route when setup wrote one, otherwise inherit this conversation. Instruct no writes in the prompt. Posture, not a sandbox.

Each explorer gets the prompt in `references/explorer-prompt.md` with its angle filled in. Then go to Step 3.

## Step 2b. Direct explain, simple questions

Spawn a single `pstack_spawn` (`role: how-explainer`, `run_in_background: true`) that explores and explains in one pass. Do not send `model`. Overlay or inherit. Instruct no writes in the prompt.

Build its prompt from `references/explainer-prompt.md` without the explorer-findings section. Go to Step 4.

## Step 3. Synthesize, complex questions only

Once all explorers return, spawn a single `pstack_spawn` (`role: how-explainer`) to synthesize their findings into one explanation. Do not send `model`. Overlay or inherit. Instruct no writes in the prompt.

Build its prompt from `references/explainer-prompt.md` with every explorer's findings filled in.

## Step 4. Present

Present the explainer's output to the user. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
