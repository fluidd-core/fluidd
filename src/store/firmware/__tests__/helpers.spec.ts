import {
  agentErrorMessage,
  apiVersionOf,
  applyEvent,
  endLostRun,
  finishedRunOf,
  formatResponse,
  isStatusResponse,
  isUpdateResponse,
  needsRetry,
  reconcileRun,
  unsupportedStatus,
  updatableMcus
} from '../helpers'
import { createState } from '../state'

const event = (overrides: Partial<Aldis.UpdateResponse> = {}): Aldis.UpdateResponse => ({
  run_id: 'r1',
  mcu: 'can',
  phase: 'flash',
  message: 'flashing firmware',
  complete: false,
  ...overrides
})

const result: Aldis.RunResult = {
  outcome: 'success',
  klippy_state: 'ready',
  klipper_left_stopped: false,
  mcus: [{ name: 'can', outcome: 'updated', message: 'updated' }]
}

const final = event({ mcu: null, phase: 'done', message: '1 updated', complete: true, result })

const running: Aldis.Run = { run_id: 'r1', state: 'running', messages: [event(), event({ message: 'wrote 49152 bytes' })], result: null }

const finished: Aldis.Run = { run_id: 'r1', state: 'finished', messages: [...running.messages, final], result }

const status = (overrides: Partial<Aldis.StatusResponse> = {}): Aldis.StatusResponse => ({
  api_version: 1,
  host: { klippy_state: 'ready', klippy_message: 'Printer is ready', software_version: 'v0.13.0-770' },
  blocker: null,
  mcus: [
    { name: 'mcu', transport: null, running_version: 'v0.13.0-770', state: 'current', message: '', actions: [] },
    { name: 'can', transport: { type: 'can', interface: 'can0', uuid: 'abc' }, running_version: 'v0.13.0-753', state: 'update_available', message: '', actions: ['update'] }
  ],
  run: null,
  ...overrides
})

describe('formatResponse', () => {
  it('prefixes the MCU name when present', () => {
    expect(formatResponse(event(), 3)).toEqual({ id: 3, message: 'can: flashing firmware', mcu: 'can', phase: 'flash' })
  })

  it('leaves host-level lines bare', () => {
    expect(formatResponse(event({ mcu: null, phase: 'stop-klipper', message: 'stopping Klipper' }), 0).message)
      .toBe('stopping Klipper')
  })
})

describe('applyEvent', () => {
  it('starts a run from its first event', () => {
    expect(applyEvent(null, event())).toEqual({ run_id: 'r1', state: 'running', messages: [event()], result: null })
  })

  it('appends to the same run', () => {
    const next = applyEvent(applyEvent(null, event()), event({ message: 'wrote 49152 bytes' }))

    expect(next.messages.map(m => m.message)).toEqual(['flashing firmware', 'wrote 49152 bytes'])
  })

  it('finishes the run on the final payload', () => {
    const next = applyEvent(applyEvent(null, event()), final)

    expect(next.state).toBe('finished')
    expect(next.result).toEqual(result)
    expect(next.messages).toHaveLength(2)
  })

  it('normalises a missing result to null', () => {
    expect(applyEvent(null, { ...final, result: undefined }).result).toBeNull()
  })

  it('replaces the run when another one starts', () => {
    const done = applyEvent(applyEvent(null, event()), final)

    expect(applyEvent(done, event({ run_id: 'r2' }))).toEqual({ run_id: 'r2', state: 'running', messages: [event({ run_id: 'r2' })], result: null })
  })
})

describe('endLostRun', () => {
  it('finishes the run without a result and logs why', () => {
    const next = endLostRun(running, 'lost')

    expect(next.state).toBe('finished')
    expect(next.result).toBeNull()
    expect(next.messages.map(m => m.message)).toEqual(['flashing firmware', 'wrote 49152 bytes', 'lost'])
  })
})

describe('reconcileRun', () => {
  it('keeps the run when there is no snapshot', () => {
    expect(reconcileRun(running, null)).toBe(running)
    expect(reconcileRun(null, null)).toBeNull()
  })

  it('adopts a running run', () => {
    expect(reconcileRun(null, running)).toBe(running)
  })

  it('takes a running snapshot holding at least the events seen', () => {
    expect(reconcileRun(applyEvent(null, event()), running)).toBe(running)
  })

  it('keeps the events seen when the snapshot holds fewer', () => {
    const followed = applyEvent(applyEvent(applyEvent(null, event()), event()), event())

    expect(reconcileRun(followed, running)?.messages).toHaveLength(3)
  })

  it('ignores a running snapshot taken before the final event', () => {
    const done = applyEvent(running, final)

    expect(reconcileRun(done, running)).toBe(done)
    expect(reconcileRun(done, finished)).toBe(done)
  })

  it('ends a run whose final event this page missed', () => {
    expect(reconcileRun(applyEvent(null, event()), finished)).toBe(finished)
  })

  it('takes the agent\'s outcome for a lost run', () => {
    expect(reconcileRun(endLostRun(running, 'lost'), finished)).toBe(finished)
  })

  it('resumes a lost run the agent still reports running', () => {
    expect(reconcileRun(endLostRun(running, 'lost'), running)).toBe(running)
  })

  it('adopts a different running run after one has finished', () => {
    const other: Aldis.Run = { ...running, run_id: 'r2', messages: [event({ run_id: 'r2' })] }

    expect(reconcileRun(finished, other)).toBe(other)
  })

  it('adopts a finished run when idle', () => {
    expect(reconcileRun(null, finished)).toBe(finished)
  })

  it('takes a different finished run', () => {
    expect(reconcileRun({ ...running, run_id: 'r0' }, finished)).toBe(finished)
  })
})

describe('finishedRunOf', () => {
  it('returns a finished run', () => {
    expect(finishedRunOf({ ...createState(), run: finished })).toBe(finished)
  })

  it.each([
    ['running', { ...createState(), run: running }],
    ['pending', { ...createState(), pending: true, run: finished }],
    ['dismissed', { ...createState(), run: finished, dismissedRunId: 'r1' }]
  ])('is null when %s', (_, state) => {
    expect(finishedRunOf(state)).toBeNull()
  })
})

describe('needsRetry', () => {
  it('asks for a retry when a finished run is still reported running', () => {
    expect(needsRetry(finished, running)).toBe(true)
  })

  it.each([
    ['running', running, running],
    ['finished', finished, finished],
    ['other run', finished, { ...running, run_id: 'r2' }],
    ['no snapshot', finished, null],
    ['no run', null, running]
  ])('does not retry when %s', (_, current, run) => {
    expect(needsRetry(current, run)).toBe(false)
  })
})

describe('updatableMcus', () => {
  it('lists MCUs that are update_available with the update action', () => {
    expect(updatableMcus(status())).toEqual(['can'])
  })

  it('excludes unknown states even when they carry the update action', () => {
    const s = status({ mcus: [{ name: 'x', transport: null, running_version: null, state: 'future_state', message: '', actions: ['update'] }] })

    expect(updatableMcus(s)).toEqual([])
  })

  it('excludes everything under a blocker', () => {
    expect(updatableMcus(status({ blocker: { reason: 'printing', message: 'busy' } }))).toEqual([])
  })

  it('excludes everything under an unsupported api version', () => {
    expect(updatableMcus(status({ api_version: 2 }))).toEqual([])
  })

  it('is empty with no status', () => {
    expect(updatableMcus(null)).toEqual([])
  })

  it('excludes update_available without the update action', () => {
    const s = status({ mcus: [{ name: 'x', transport: null, running_version: null, state: 'update_available', message: '', actions: [] }] })

    expect(updatableMcus(s)).toEqual([])
  })
})

describe('isUpdateResponse', () => {
  it('accepts a well-formed payload', () => {
    expect(isUpdateResponse(event())).toBe(true)
    expect(isUpdateResponse(event({ mcu: null, result: null }))).toBe(true)
  })

  it.each([
    undefined,
    null,
    'flashing',
    { run_id: 'r1' },
    { run_id: 'r1', mcu: 'can', phase: 'flash', message: null, complete: false },
    { run_id: 1, mcu: 'can', phase: 'flash', message: 'x', complete: false },
    { run_id: 'r1', mcu: 'can', phase: 'flash', message: 'x', complete: 'no' },
    { run_id: 'r1', mcu: null, phase: 'done', message: 'x', complete: true, result: 'bad' },
    { run_id: 'r1', mcu: null, phase: 'done', message: 'x', complete: true, result: { outcome: 'success' } },
    { run_id: 'r1', mcu: null, phase: 'done', message: 'x', complete: true, result: { outcome: 'anything', klippy_state: 'ready', klipper_left_stopped: false, mcus: [] } },
    { run_id: 'r1', mcu: 'can', phase: 5, message: 'x', complete: false }
  ])('rejects %o', value => {
    expect(isUpdateResponse(value)).toBe(false)
  })

  it('accepts a complete payload with a well-formed result', () => {
    expect(isUpdateResponse(event({ mcu: null, phase: 'done', complete: true, result }))).toBe(true)
  })
})

describe('isStatusResponse', () => {
  it('accepts a well-formed status', () => {
    expect(isStatusResponse(status())).toBe(true)
  })

  it('accepts a status with no run key', () => {
    const withoutRun: Partial<Aldis.StatusResponse> = status()
    delete withoutRun.run

    expect(isStatusResponse(withoutRun)).toBe(true)
  })

  it('accepts an MCU with a null running_version', () => {
    const s = status({ mcus: [{ name: 'x', transport: null, running_version: null, state: 'current', message: '', actions: [] }] })

    expect(isStatusResponse(s)).toBe(true)
  })

  it.each([
    null,
    {},
    { ...status(), mcus: 'x' },
    { ...status(), mcus: [{ name: 'x', transport: null, running_version: null, state: 'current', message: '' }] },
    { ...status(), run: 'bad' },
    { ...status(), run: { run_id: 'r1', state: 'running', messages: 'x', result: null } },
    { ...status(), run: { run_id: 'r1', state: 'running', messages: [{ ...event(), message: null }], result: null } },
    { ...status(), mcus: [{ name: 'x', transport: null, running_version: null, state: 'current', message: 5, actions: [] }] }
  ])('rejects %o', value => {
    expect(isStatusResponse(value)).toBe(false)
  })
})

describe('apiVersionOf', () => {
  it('reads the api_version from a well-formed payload', () => {
    expect(apiVersionOf(status())).toBe(1)
  })

  it.each([
    {},
    null,
    'v1'
  ])('returns null for %o', value => {
    expect(apiVersionOf(value)).toBeNull()
  })
})

describe('unsupportedStatus', () => {
  it('builds a placeholder status carrying the reported api_version', () => {
    const s = unsupportedStatus(2)

    expect(s.api_version).toBe(2)
    expect(s.mcus).toEqual([])
    expect(s.run).toBeNull()
  })
})

describe('agentErrorMessage', () => {
  it('unwraps a Moonraker-relayed agent error', () => {
    const error = { code: 424, message: 'Agent aldis RPC error', data: { code: -32000, message: 'update already running', data: { reason: 'busy' } } }

    expect(agentErrorMessage(error)).toBe('update already running')
  })

  it('falls back to the outer message for a Moonraker-level error', () => {
    const error = { code: 400, message: 'Agent aldis not connected' }

    expect(agentErrorMessage(error)).toBe('Agent aldis not connected')
  })

  it('handles thrown Errors and unknown values', () => {
    expect(agentErrorMessage(new Error('Socket not ready'))).toBe('Socket not ready')
    expect(agentErrorMessage('boom')).toBe('boom')
  })
})
