import type { Agent } from '@deepseek-ai/dsh-agent'
import { SessionId } from '@deepseek-ai/dsh-session/types'

const unused = (): never => { throw new Error('unexpected Agent fixture access') }

export const parent: Agent = {
  id: SessionId('parent'),
  get options() { return unused() },
  get session() { return unused() },
  get inbox() { return unused() },
  get ctx() { return unused() },
  status: 'idle',
  cancel: unused,
  whenIdle: unused,
  runMaintenance: unused,
  send: unused,
  followup: unused,
  steer: unused,
  inject: unused,
}
