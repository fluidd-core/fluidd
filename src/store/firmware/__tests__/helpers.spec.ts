import {
  agentErrorMessage,
  agentErrorReason,
  apiVersionOf,
  applyEvent,
  formatResponse,
  isStatusResponse,
  isUpdateResponse,
  needsRetry,
  reconcileRun,
  unsupportedStatus,
  updatableMcus
} from '../helpers'
import type { FirmwareRunState } from '../types'

const idle = (): FirmwareRunState => ({
  busy: false,
  runId: null,
  responses: [],
  lastResult: null,
  lastMessage: null,
  resultRunId: null,
  dismissedRunId: null
})

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

const reconcileUnknown = (state: FirmwareRunState, run: unknown): FirmwareRunState => reconcileRun(state, run as Aldis.Run | null)

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
  it('appends and adopts the run from the first event', () => {
    const next = applyEvent(idle(), event())

    expect(next.busy).toBe(true)
    expect(next.runId).toBe('r1')
    expect(next.responses.map(r => r.message)).toEqual(['can: flashing firmware'])
  })

  it('keeps the existing run id and appends with the next id', () => {
    const next = applyEvent(applyEvent(idle(), event()), event({ message: 'wrote 49152 bytes' }))

    expect(next.responses.map(r => r.id)).toEqual([0, 1])
  })

  it('ends the run on the final payload', () => {
    const next = applyEvent(applyEvent(idle(), event()), event({ mcu: null, phase: 'done', message: '1 updated', complete: true, result }))

    expect(next.busy).toBe(false)
    expect(next.lastResult).toEqual(result)
    expect(next.lastMessage).toBe('1 updated')
    expect(next.responses).toHaveLength(2)
  })
})

describe('reconcileRun', () => {
  const running: Aldis.Run = { run_id: 'r1', state: 'running', messages: [event(), event({ message: 'wrote 49152 bytes' })], result: null }
  const finished: Aldis.Run = { run_id: 'r1', state: 'finished', messages: [...running.messages, event({ mcu: null, phase: 'done', message: '1 updated', complete: true, result })], result }

  it('hydrates a running run when the page knows none', () => {
    const next = reconcileRun(idle(), running)

    expect(next.busy).toBe(true)
    expect(next.runId).toBe('r1')
    expect(next.responses.map(r => r.message)).toEqual(['can: flashing firmware', 'can: wrote 49152 bytes'])
  })

  it('ignores every snapshot once a run id is known', () => {
    const followed = applyEvent(idle(), event())

    expect(reconcileRun(followed, running)).toBe(followed)
    expect(reconcileRun(followed, finished)).toBe(followed)
    expect(reconcileRun(followed, null)).toBe(followed)
  })

  it('fills the last result from a finished run without touching the log', () => {
    const next = reconcileRun(idle(), finished)

    expect(next.busy).toBe(false)
    expect(next.runId).toBeNull()
    expect(next.responses).toEqual([])
    expect(next.lastResult).toEqual(result)
    expect(next.lastMessage).toBe('1 updated')
  })

  it('does not overwrite a result the page already holds', () => {
    const held = { ...idle(), lastResult: result, lastMessage: 'held' }

    expect(reconcileRun(held, finished).lastMessage).toBe('held')
  })

  it('leaves an idle page alone when there is no run', () => {
    expect(reconcileRun(idle(), null)).toEqual(idle())
  })

  it('does not refill a result the user dismissed', () => {
    const next = reconcileRun(idle(), finished)
    const dismissed = { ...next, lastResult: null, lastMessage: null, dismissedRunId: next.resultRunId, resultRunId: null }

    expect(reconcileRun(dismissed, finished).lastResult).toBeNull()
  })

  it('refills a different run\'s result after a dismissal', () => {
    const next = reconcileRun(idle(), finished)
    const dismissed = { ...next, lastResult: null, lastMessage: null, dismissedRunId: next.resultRunId, resultRunId: null }
    const other: Aldis.Run = { run_id: 'r2', state: 'finished', messages: [event({ run_id: 'r2', mcu: null, phase: 'done', message: '1 updated', complete: true, result })], result }

    expect(reconcileRun(dismissed, other).lastResult).toEqual(result)
  })

  it('treats an undefined run as absent', () => {
    expect(reconcileUnknown(idle(), undefined)).toEqual(idle())
  })

  it('fills the result of a finished run', () => {
    expect(reconcileRun(idle(), finished).lastResult).toEqual(result)
  })

  it('normalises a missing result to null', () => {
    const finishedWithoutResult = {
      run_id: 'r1',
      state: 'finished',
      messages: [event({ mcu: null, phase: 'done', message: '1 updated', complete: true })]
    }

    expect(reconcileUnknown(idle(), finishedWithoutResult).lastResult).toBeNull()
  })

  it('walks the normal run: click, events, snapshot, final event, stale snapshot, finish', () => {
    let state: FirmwareRunState = { ...idle(), busy: true }
    state = applyEvent(state, event())
    state = reconcileRun(state, running)
    expect(state.responses).toHaveLength(1)
    state = applyEvent(state, event({ mcu: null, phase: 'done', message: '1 updated', complete: true, result }))
    expect(state.busy).toBe(false)
    state = reconcileRun(state, running)
    expect(state.busy).toBe(false)
    state = { ...state, responses: [] }
    state = reconcileRun(state, finished)
    expect(state.responses).toEqual([])
  })
})

describe('needsRetry', () => {
  it('asks for a retry when a completed run is still reported running', () => {
    const done = { ...idle(), runId: 'r1', busy: false }

    expect(needsRetry(done, { run_id: 'r1', state: 'running', messages: [], result: null })).toBe(true)
  })

  it.each([
    ['busy', { ...idle(), runId: 'r1', busy: true }, { run_id: 'r1', state: 'running' as const, messages: [], result: null }],
    ['finished', { ...idle(), runId: 'r1', busy: false }, { run_id: 'r1', state: 'finished' as const, messages: [], result: null }],
    ['other run', { ...idle(), runId: 'r1', busy: false }, { run_id: 'r2', state: 'running' as const, messages: [], result: null }],
    ['no run', { ...idle(), runId: 'r1', busy: false }, null],
    ['no run id', idle(), { run_id: 'r1', state: 'running' as const, messages: [], result: null }]
  ])('does not retry when %s', (_, state, run) => {
    expect(needsRetry(state, run)).toBe(false)
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
    expect(agentErrorReason(error)).toBe('busy')
  })

  it('falls back to the outer message for a Moonraker-level error', () => {
    const error = { code: 400, message: 'Agent aldis not connected' }

    expect(agentErrorMessage(error)).toBe('Agent aldis not connected')
    expect(agentErrorReason(error)).toBeNull()
  })

  it('handles thrown Errors and unknown values', () => {
    expect(agentErrorMessage(new Error('Socket not ready'))).toBe('Socket not ready')
    expect(agentErrorMessage('boom')).toBe('boom')
  })
})
