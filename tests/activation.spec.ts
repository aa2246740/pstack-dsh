import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { MessageId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SubagentActivation, SubagentResult } from '@deepseek-ai/dsh-subagent'
import { spawnTool, type SubagentHandle } from '../src/tools.ts'
import { parent } from './agent-fixture.ts'

async function fixture(t: TestContext, mapped = false) {
  const home = await mkdtemp(join(tmpdir(), 'pstack-activation-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  if (mapped) await writeFile(join(home, 'pstack-dsh.json'), JSON.stringify({
    version: 1, roles: { feature: { inherit: false, routes: [{ provider: 'test', model: 'test-model', reasoningEffort: 'high' }] } },
  }))
  const calls: Parameters<SubagentHandle['startActivation']>[0][] = []
  const started = Promise.withResolvers<void>()
  const result = Promise.withResolvers<SubagentResult>()
  let disposals = 0
  const run: SubagentActivation & { messageId: MessageId } = {
    childId: SessionId('child'), messageId: MessageId('accepted'), result: result.promise,
    async dispose() { disposals++ },
  }
  const subagents: SubagentHandle = {
    resolveMaxDepth: () => 3,
    getProvider: () => ({
      name: 'spawn', inheritsParentContext: false,
      capabilities: { agentOptions: true, agentPreset: true, outputSchema: true, depthLimit: true },
      async prepareContinuable() { return {} },
    }),
    async startActivation(spec) { calls.push(spec); started.resolve(); return run },
  }
  const controller = new AbortController()
  const tool = spawnTool({ subagents, dshHome: home })
  const args = { role: 'feature', description: 'Verify activation contract', prompt: 'Return OK' }
  const exec = { agent: parent, signal: controller.signal }
  const call = () => {
    assert.equal(calls.length, 1)
    const [value] = calls
    assert.ok(value)
    return value
  }
  return { tool, args, exec, subagents, calls, call, started, result, controller, disposals: () => disposals }
}

for (const background of [true, false]) {
  test(`activation contract with mapped route, background=${background}`, async t => {
    const f = await fixture(t, true)
    f.result.resolve({ output: [{ type: 'text', text: 'OK' }], stopReason: 'completed' })
    const result = await f.tool.execute({ ...f.args, run_in_background: background }, f.exec)
    assert.equal(f.calls.length, 1)
    const [spec] = f.calls
    assert.ok(spec)
    assert.equal(spec.signal, f.controller.signal)
    assert.equal(spec.provider, 'spawn')
    assert.equal(spec.label, 'Verify activation contract')
    assert.equal(spec.delivery, background ? 'parent' : 'caller')
    assert.equal(spec.request.parent, parent)
    assert.equal(spec.request.maxDepth, 3)
    assert.deepEqual(spec.request.agentOptions, { provider: 'test', model: 'test-model', reasoningEffort: 'high' })
    assert.equal('persona' in spec.request, false)
    assert.equal('signal' in spec.request, false)
    const text = JSON.stringify(spec.request.prompt)
    assert.match(text, /Poteto subagent/)
    assert.match(text, /Return OK/)
    assert.deepEqual(result, background
      ? { kind: 'continuable', subagentId: 'child', role: 'feature', inherit: false }
      : { kind: 'foreground', runId: 'child', role: 'feature', inherit: false, output: [{ type: 'text', text: 'OK' }], stopReason: 'completed' })
    assert.equal(f.disposals(), background ? 0 : 1)
  })
}

test('background inheritance omits child overrides and outlives tool cancellation', async t => {
  const f = await fixture(t)
  const result = await f.tool.execute(f.args, f.exec)
  assert.deepEqual(result, { kind: 'continuable', subagentId: 'child', role: 'feature', inherit: true })
  assert.equal('agentOptions' in f.call().request, false)
  f.controller.abort()
  assert.equal(f.disposals(), 0)
})

test('one-shot provider uses managed parent delivery', async t => {
  const f = await fixture(t)
  f.subagents.getProvider = () => ({
    name: 'external', inheritsParentContext: false,
    capabilities: { agentOptions: true, agentPreset: false, outputSchema: false, depthLimit: true },
  })
  const result = await f.tool.execute(f.args, f.exec)
  assert.deepEqual(result, { kind: 'activation', subagentId: 'child', role: 'feature', inherit: true })
  assert.equal(f.calls[0]?.delivery, 'parent')
  assert.equal(f.call().request.maxDepth, 3)
  assert.equal(f.disposals(), 0)
})

test('foreground result failure releases the activation exactly once', async t => {
  const f = await fixture(t)
  const pending = f.tool.execute({ ...f.args, run_in_background: false }, f.exec)
  const rejected = assert.rejects(pending, /child failed/)
  await f.started.promise
  f.result.reject(new Error('child failed'))
  await rejected
  assert.equal(f.disposals(), 1)
})

test('foreground cancellation disposes without waiting for a pending child result', { timeout: 1000 }, async t => {
  const f = await fixture(t)
  const pending = f.tool.execute({ ...f.args, run_in_background: false }, f.exec)
  const rejected = assert.rejects(pending, /cancelled by caller/)
  await f.started.promise
  await setImmediate()
  f.controller.abort(new Error('cancelled by caller'))
  await rejected
  assert.equal(f.disposals(), 1)
})

test('startup failure propagates without creating an activation', async t => {
  const f = await fixture(t)
  f.subagents.startActivation = async () => { throw new Error('startup rejected') }
  await assert.rejects(f.tool.execute(f.args, f.exec), /startup rejected/)
  assert.equal(f.disposals(), 0)
})

test('already-aborted calls start no child', async t => {
  const f = await fixture(t)
  f.controller.abort(new Error('cancelled before startup'))
  await assert.rejects(f.tool.execute(f.args, f.exec), /cancelled before startup/)
  assert.equal(f.calls.length, 0)
})

test('missing provider is reported before startup', async t => {
  const f = await fixture(t)
  f.subagents.getProvider = () => undefined
  await assert.rejects(f.tool.execute(f.args, f.exec), /provider "spawn" is unavailable/)
  assert.equal(f.calls.length, 0)
})
