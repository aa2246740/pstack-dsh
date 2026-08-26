/**
 * Official Cursor `/setup-pstack` SKILL.md step 5 defaults, shown as Settings copy.
 * Not picker options. independent-verifier / poteto-agent / comment-sicko have no line.
 */
import type { PstackRole } from '../roles.ts'

const GROK = 'grok-4.6-fast-xhigh'
const SOL = 'gpt-5.6-sol-max'
const FABLE = 'claude-fable-5-thinking-max'
const PANEL = `${FABLE}, ${SOL}, ${GROK}, claude-opus-5-thinking-xhigh`

export const POTETO_DEFAULT_SLUGS = {
  feature: GROK,
  refactoring: GROK,
  'bug-fix': SOL,
  'perf-issue': SOL,
  hillclimb: SOL,
  'judgment-and-prose': FABLE,
  'hardest-tasks': FABLE,
  'how-explorer': GROK,
  'how-explainer': FABLE,
  'why-investigators': GROK,
  'why-synthesizer': FABLE,
  'reflect-tooling': SOL,
  'reflect-judgment': FABLE,
  'swarm-workers': GROK,
  'independent-verifier': '',
  'poteto-agent': '',
  'comment-sicko': '',
  'how-critics': PANEL,
  'arena-runners': PANEL,
  'arena-cross-judge-pool': PANEL,
  'architect-runners': PANEL,
  'interrogate-reviewers': PANEL,
} as const satisfies Record<PstackRole, string>

export function potetoNoteCopy(role: PstackRole, prefix: string): string {
  const slugs = POTETO_DEFAULT_SLUGS[role]
  return slugs.length === 0 ? '' : `${prefix}${slugs}`
}
