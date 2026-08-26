import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { en, zh } from '../src/client/locales.ts'
import { POTETO_DEFAULT_SLUGS, potetoNoteCopy } from '../src/client/poteto-defaults.ts'
import { ALL_ROLES, type PstackRole } from '../src/roles.ts'

const GROK = 'grok-4.6-fast-xhigh'
const SOL = 'gpt-5.6-sol-max'
const FABLE = 'claude-fable-5-thinking-max'
const PANEL = 'claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh'

const EXPECTED: Record<PstackRole, string> = {
  feature: GROK,
  refactoring: GROK,
  'how-explorer': GROK,
  'why-investigators': GROK,
  'swarm-workers': GROK,
  'bug-fix': SOL,
  'perf-issue': SOL,
  hillclimb: SOL,
  'reflect-tooling': SOL,
  'judgment-and-prose': FABLE,
  'hardest-tasks': FABLE,
  'how-explainer': FABLE,
  'why-synthesizer': FABLE,
  'reflect-judgment': FABLE,
  'how-critics': PANEL,
  'arena-runners': PANEL,
  'arena-cross-judge-pool': PANEL,
  'architect-runners': PANEL,
  'interrogate-reviewers': PANEL,
  'independent-verifier': '',
  'poteto-agent': '',
  'comment-sicko': '',
}

describe('Poteto Settings notes', () => {
  it('matches official setup-pstack step 5 slugs for every role', () => {
    assert.deepEqual([...ALL_ROLES].sort(), Object.keys(EXPECTED).sort())
    for (const role of ALL_ROLES) {
      assert.equal(POTETO_DEFAULT_SLUGS[role], EXPECTED[role])
    }
  })

  it('formats zh and en notes without inherit-parent lectures', () => {
    assert.equal(en.potetoPrefix, 'Poteto: ')
    assert.equal(zh.potetoPrefix, 'Poteto：')
    assert.ok(!('inheritHint' in en))
    assert.ok(!('panelHint' in en))
    assert.equal(potetoNoteCopy('feature', en.potetoPrefix), `Poteto: ${GROK}`)
    assert.equal(potetoNoteCopy('feature', zh.potetoPrefix), `Poteto：${GROK}`)
    assert.equal(potetoNoteCopy('how-critics', en.potetoPrefix), `Poteto: ${PANEL}`)
    assert.equal(potetoNoteCopy('how-critics', zh.potetoPrefix), `Poteto：${PANEL}`)
    assert.equal(potetoNoteCopy('independent-verifier', en.potetoPrefix), '')
    assert.equal(potetoNoteCopy('poteto-agent', zh.potetoPrefix), '')
    assert.equal(potetoNoteCopy('comment-sicko', en.potetoPrefix), '')
  })
})
