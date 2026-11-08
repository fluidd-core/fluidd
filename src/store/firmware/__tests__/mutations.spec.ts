import { mutations } from '../mutations'
import { createState } from '../state'

const run = (state: Aldis.Run['state'], runId = 'r1'): Aldis.Run => ({ run_id: runId, state, messages: [], result: null })

describe('setReset', () => {
  it('keeps the dismissed run id and clears everything else', () => {
    const state = { ...createState(), refreshing: true, pending: true, run: run('running'), logRunId: 'r1', dismissedRunId: 'r0' }

    mutations.setReset(state)

    expect(state).toEqual({ ...createState(), dismissedRunId: 'r0' })
  })
})

describe('setRun', () => {
  it('shows the log of a new running run', () => {
    const state = createState()

    mutations.setRun(state, run('running'))

    expect(state.logRunId).toBe('r1')
  })

  it('does not show the log of a finished run found while idle', () => {
    const state = createState()

    mutations.setRun(state, run('finished'))

    expect(state.logRunId).toBeNull()
  })

  it('keeps pending and the log closed for an older finished run', () => {
    const state = { ...createState(), pending: true }

    mutations.setRun(state, run('finished'))

    expect(state.pending).toBe(true)
    expect(state.logRunId).toBeNull()
  })

  it('ends pending once a running run is adopted', () => {
    const state = { ...createState(), pending: true }

    mutations.setRun(state, run('running'))

    expect(state.pending).toBe(false)
    expect(state.logRunId).toBe('r1')
  })

  it('keeps a closed log closed for the same run', () => {
    const state = { ...createState(), run: run('running') }

    mutations.setRun(state, run('finished'))

    expect(state.logRunId).toBeNull()
  })
})

describe('setRunStarted', () => {
  it('starts an empty run when no event arrived yet', () => {
    const state = { ...createState(), pending: true }

    mutations.setRunStarted(state, 'r1')

    expect(state).toEqual({ ...createState(), run: run('running'), logRunId: 'r1' })
  })

  it('keeps a run its events already started', () => {
    const current = { ...run('running'), messages: [{ run_id: 'r1', mcu: null, phase: 'build', message: 'building', complete: false }] }
    const state = { ...createState(), pending: false, run: current, logRunId: 'r1' }

    mutations.setRunStarted(state, 'r1')

    expect(state.run).toBe(current)
  })
})

describe('setUpdateStarted', () => {
  it('marks the update pending and hides the previous log', () => {
    const state = { ...createState(), retried: true, run: run('finished'), logRunId: 'r1' }

    mutations.setUpdateStarted(state)

    expect(state).toEqual({ ...createState(), pending: true, run: run('finished') })
  })
})

describe('setClearLastResult', () => {
  it('remembers the dismissed run', () => {
    const state = { ...createState(), run: run('finished') }

    mutations.setClearLastResult(state)

    expect(state.dismissedRunId).toBe('r1')
  })
})
