---
name: why
description: "Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior."
---

# Why

Investigate the motivation and intent behind code.

Companion to the `how` skill. `how` answers what the code does and how it works. `why` answers what forces led to its shape.

## Operating posture

Operate as a careful, cautious, and precise investigator. Be honest about what you know versus what you're inferring. Read `references/epistemics.md` for the full confidence framework and phrasing guide. The synthesizer must follow it.

## Step 1. Understand the target and the question

Parse what the user is asking. The target is usually a chunk of code, a pattern, a feature, or a named design decision. The question is usually a design rationale, a tradeoff, a motivating edge case, an external constraint, dead code, or a broad history sweep.

If the target is vague, make your best guess from conversation context. State your interpretation briefly so the user can redirect, then proceed.

## Step 2. Establish the code anchor

Before spawning investigators, anchor the investigation in concrete code. You need:

- The relevant file paths and line ranges
- The key symbols, such as function names, class names, constants
- An initial commit list. The last few commits touching the target.
- PR numbers from merge commits, such as `(#1234)` in the subject line

Build this inline.

```bash
# Blame target lines for last-touch commits
git blame -L <start>,<end> <file>

# Full file history, with patches, through renames
git log --follow -p -- <file>

# Last N commits touching the file, PR numbers visible
git log --oneline -20 -- <file>

# Extract PR numbers from a commit message
git log -1 --format=%B <commit>
```

Pull PR bodies and discussion via `gh` for any substantive commits:

```bash
gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews
```

Capture file paths, symbols, commits, PR numbers, and linked ticket IDs as seed context. Pass it to the investigators.

## Step 3. Spawn parallel investigators

**Default to the full parallel investigation.**

### Discovery

Before spawning investigators, list the tools and MCP-like servers this DSH session actually has. Use the live tool catalog. Do not assume Cursor MCP paths.

Map each available MCP to one evidence category:

1. Source control history
2. Issue / ticket tracker
3. Long-form documents
4. Real-time team chat
5. Infrastructure observability
6. Error / exception tracking
7. Product analytics warehouse

Source control is available through git and `gh` when installed and authorized. Report unavailable tools as gaps rather than inventing results. For the other six categories, classify using the MCP name, server instructions, tool names, and resource descriptors. If an MCP could fit more than one category, choose the one matching its primary evidence. Record ambiguous cases in the coverage map.

Aim for a complete coverage map, not a minimal one. Document the null, don't skip the search.

Launch all matching investigators in a single message so they run concurrently. Don't ask one agent to cover multiple MCPs.

Subagent config for each: `pstack_spawn` `role: why-investigators`, `run_in_background: true`. Do not send `model` or `readonly`. Overlay or inherit. Instruct investigators not to write. Follow [`../setup-pstack/references/spawn.md`](../setup-pstack/references/spawn.md).

Each investigator gets:
1. The base prompt from `references/investigator-prompt.md`
2. The category playbook `references/sources/<source>.md` for the selected MCP, adapted from the examples in `references/source-playbook.md`
3. The cross-cutting `references/sources/incident-postmortem.md` if the target code looks defensive, such as null checks, retry logic, timeout handling, rate limiting, feature flags, egress guards, or OOM handlers
4. The code anchor from Step 2
5. The user's original question

### Investigator roster. One per available evidence category

Spawn one investigator per category with an available source. Each owns exactly one tool or MCP. Use the category's purpose to name gaps and justify any provably irrelevant source.

1. **Source control investigator.** Git history, `gh` for PRs, code comments, tests. Spawn when available. Best at surfacing implementation-time rationale captured during review.

2. **Issue / ticket tracker investigator.** Linear, Jira, GitHub Issues, Plane, or Shortcut MCP. Best at surfacing the product or business forcing function. Strongest when the why is external to engineering.

3. **Long-form documents investigator.** Notion, Confluence, Google Docs, or Coda MCP. Best at surfacing long-form design rationale. Where the why is written out before it becomes code.

4. **Real-time team chat investigator.** Slack, Discord, Microsoft Teams, or Mattermost MCP. Best at surfacing real-time deliberation that never reached a doc. Especially important when the source control, ticket, and doc paper trail is thin.

5. **Infrastructure observability investigator.** Datadog, New Relic, Honeycomb, Grafana, or Splunk MCP. Best at surfacing infrastructure and runtime reality that motivated the code. Strongest when the target reacts to timeouts, retries, rate limits, or circuit breakers.

6. **Error / exception tracking investigator.** Sentry, Rollbar, Bugsnag, or Airbrake MCP. Best at surfacing the specific exceptions and error trajectories that motivated defensive or corrective code. Strongest for catch blocks, null guards, type checks, retries, and other defenses.

7. **Product analytics warehouse investigator.** Databricks, Snowflake, BigQuery, ClickHouse, dbt, or Redshift MCP. Best at surfacing product and data reality that shaped the code. Strongest for flag-gated code, experiment-driven ships, data migrations, and "where did this number come from" questions.

### When to skip an investigator

Only skip with an explicit, written justification in the final "Sources Consulted" section. Two valid reasons:

- No source is available for that category in this environment. Flag this as a gap, not a choice. Example: "Real-time team chat skipped. No matching MCP available, so the conversational record was not searchable."
- The source is provably irrelevant, not just "probably irrelevant." A high bar. Example: "Error / exception tracking skipped. Target is a build-time script with no runtime code path."

If your scope assessment suggests a single-commit trivial target where the PR description already contains the complete answer, you may answer inline only after confirming all seven available category searches would be redundant. Say so explicitly. This should be rare.

## Step 4. Synthesize

Spawn one synthesizer with `pstack_spawn` `role: why-synthesizer`. Do not send `model` or `readonly`. Overlay or inherit. The synthesizer's quality check spot-verifies citations and needs the same tools the parent has.

The synthesizer gets:
1. The investigator findings, including any null results and any categories skipped with justification
2. The code anchor from Step 2
3. The user's original question
4. The epistemics framework from `references/epistemics.md`
5. The synthesizer prompt template from `references/synthesizer-prompt.md`

## Step 5. Present

Take the synthesizer's output and present it to the user. You may lightly edit for clarity or add context from the conversation, but do not rewrite the confidence language.

## Output format

Use the structure in `references/synthesizer-prompt.md`: The Question, The Code in Question, What We Found, What We Can Reasonably Infer, Competing Hypotheses, What We Don't Know, Sources Consulted, Confidence Summary. Adapt as needed, but keep the confidence separation intact. Sources Consulted must have one line per investigator, including those that returned nothing or were skipped, with the reason.

After Sources Consulted, if the question precedes changing this code, convert the findings into a Preserve / Change / Avoid / Risk constraint set for planning.

## Common failure modes to avoid

- Recency bias. Assuming the most recent commit is authoritative. The current shape is often the accretion of many earlier decisions. Trace back.

## Reference files

- `references/epistemics.md`. Confidence tiers and phrasing guide. The synthesizer must follow it.
- `references/investigator-prompt.md`. Base prompt template for investigator subagents.
- `references/source-playbook.md`. Index pointing at the category playbooks below.
- `references/sources/*.md`. One self-contained example playbook per category, plus cross-cutting `incident-postmortem.md`. Give an investigator the single file that matches its category and adapt it to the available MCP.
- `references/synthesizer-prompt.md`. Prompt template for the synthesizer subagent, including the output format.
