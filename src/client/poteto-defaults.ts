import type { PstackRole } from '../roles.ts'

// Upstream 0.15 recommendations are display copy, never runtime route defaults.
const GROK = 'grok-4.6-fast-xhigh'
const SOL = 'gpt-5.6-sol-max'
const FABLE = 'claude-fable-5-1-thinking-max'
const PANEL = `${FABLE}, ${SOL}, ${GROK}, claude-opus-5-thinking-xhigh`

export const POTETO_DEFAULT_SLUGS = {
  feature: GROK,
  refactoring: GROK,
  'bug-fix': FABLE,
  'perf-issue': FABLE,
  hillclimb: FABLE,
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
  'how-critics': '',
  'arena-runners': PANEL,
  'arena-cross-judge-pool': PANEL,
  'architect-runners': PANEL,
  'interrogate-reviewers': PANEL,
} as const satisfies Record<PstackRole, string>

export function potetoNoteCopy(role: PstackRole, prefix: string): string {
  const slugs = POTETO_DEFAULT_SLUGS[role]
  return slugs.length === 0 ? '' : `${prefix}${slugs}`
}
