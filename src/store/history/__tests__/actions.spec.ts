import { SocketActions } from '@/api/socketActions'
import type { TypedStore } from '@/store'
import type { HistoryState } from '../types'
import { createHistoryJob, createTestStore } from '@/../tests/unit/store'

vi.mock('@/api/socketActions', () => ({
  SocketActions: {
    serverHistoryGetJob: vi.fn(),
    serverHistoryList: vi.fn(),
    serverHistoryTotals: vi.fn(),
    serverFilesGetDirectory: vi.fn(),
    serverFilesMetadata: vi.fn()
  }
}))

const serverHistoryGetJob = vi.mocked(SocketActions.serverHistoryGetJob)

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

const socketError = (code: number, message: string) => ({ code, message })

describe('history/fetchMissingJobs', () => {
  let store: TypedStore

  beforeEach(async () => {
    store = createTestStore()

    // Also clears the module-local in-flight set.
    await store.dispatch('history/reset')

    vi.mocked(SocketActions.serverHistoryList).mockResolvedValue({ count: 0, jobs: [] })
    serverHistoryGetJob.mockReset()
  })

  const historyState = (): HistoryState => store.state.history

  const fetch = (jobIds: (string | null | undefined)[]) =>
    store.dispatch('history/fetchMissingJobs', jobIds)

  it('issues nothing when moonraker has no history component', async () => {
    store = createTestStore([])

    await fetch(['00000f'])

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })

  it('caches every resolved job in a single commit', async () => {
    serverHistoryGetJob.mockImplementation(async (uid: string) => ({
      job: createHistoryJob({ job_id: uid, filename: `${uid}.gcode` })
    }))

    const commits: string[] = []
    const unsubscribe = store.subscribe(({ type }) => commits.push(type))

    await fetch(['00000f', '000010'])

    unsubscribe()

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(2)
    expect(commits.filter(type => type === 'history/setJobsById')).toHaveLength(1)
    expect(store.getters['history/getHistoryById']('00000f')?.filename).toBe('00000f.gcode')
    expect(store.getters['history/getHistoryById']('000010')?.filename).toBe('000010.gcode')
  })

  it('suppresses the global error toast for these requests', async () => {
    serverHistoryGetJob.mockRejectedValue(socketError(404, 'Invalid job uid: 00000f'))

    await fetch(['00000f'])

    expect(serverHistoryGetJob).toHaveBeenCalledWith('00000f', { suppressError: true })
  })

  it('records a 404 so the orphaned id is never requested again', async () => {
    serverHistoryGetJob.mockRejectedValue(socketError(404, 'Invalid job uid: 00000f'))

    await fetch(['00000f'])

    expect(historyState().missingJobIds['00000f']).toBe(true)

    await fetch(['00000f'])

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(1)
  })

  it('leaves a transient failure retryable', async () => {
    serverHistoryGetJob.mockRejectedValueOnce(new Error('Socket disconnected'))

    await fetch(['00000f'])

    expect(historyState().missingJobIds['00000f']).toBeUndefined()

    serverHistoryGetJob.mockResolvedValueOnce({ job: createHistoryJob({ job_id: '00000f' }) })

    await fetch(['00000f'])

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(2)
    expect(store.getters['history/getHistoryById']('00000f')).toBeDefined()
  })

  it('skips ids the loaded page already covers', async () => {
    store.commit('history/setHistoryList', {
      count: 1,
      jobs: [createHistoryJob({ job_id: '000001' })]
    })

    await fetch(['000001'])

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })

  it('skips ids that are already cached', async () => {
    store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])

    await fetch(['00000f'])

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })

  it('skips empty ids, and issues nothing when nothing is left', async () => {
    await fetch([null, undefined, ''])

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })

  it('requests a duplicated id once', async () => {
    serverHistoryGetJob.mockImplementation(async (uid: string) => ({
      job: createHistoryJob({ job_id: uid })
    }))

    await fetch(['00000f', '00000f'])

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(1)
  })

  it('does not re-request an id that is still in flight', async () => {
    let resolveJob: (value: Moonraker.History.JobResponse) => void = () => {}

    serverHistoryGetJob.mockReturnValueOnce(new Promise((resolve) => {
      resolveJob = resolve
    }))

    const first = fetch(['00000f'])
    await flush()

    await fetch(['00000f'])

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(1)

    resolveJob({ job: createHistoryJob({ job_id: '00000f' }) })
    await first
  })

  it('keeps at most two requests in flight', async () => {
    const pending: (() => void)[] = []
    let inFlight = 0
    let maxInFlight = 0

    serverHistoryGetJob.mockImplementation((uid: string) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)

      return new Promise((resolve) => {
        pending.push(() => {
          inFlight--
          resolve({ job: createHistoryJob({ job_id: uid }) })
        })
      })
    })

    const drain = fetch(['00000f', '000010', '000011', '000012'])

    await flush()

    expect(maxInFlight).toBe(2)
    expect(serverHistoryGetJob).toHaveBeenCalledTimes(2)

    while (pending.length > 0) {
      pending.shift()?.()
      await flush()
    }

    await drain

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(4)
    expect(maxInFlight).toBe(2)
  })
})

describe('history/repairMissingJobs', () => {
  let store: TypedStore

  beforeEach(async () => {
    store = createTestStore()

    await store.dispatch('history/reset')

    serverHistoryGetJob.mockReset()
  })

  it('drops stale negatives and re-scans the loaded directories', async () => {
    store.commit('files/setServerFilesGetDirectory', {
      path: 'gcodes',
      content: {
        dirs: [],
        files: [
          { filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' },
          { filename: 'b.gcode', modified: 0, size: 1, job_id: null },
          { filename: 'c.gcode', modified: 0, size: 1 }
        ]
      }
    })

    store.commit('history/setMissingJobIds', ['00000f'])

    serverHistoryGetJob.mockImplementation(async (uid: string) => ({
      job: createHistoryJob({ job_id: uid })
    }))

    await store.dispatch('history/repairMissingJobs')

    expect(serverHistoryGetJob).toHaveBeenCalledTimes(1)
    expect(serverHistoryGetJob).toHaveBeenCalledWith('00000f', { suppressError: true })
    expect(store.getters['history/getHistoryById']('00000f')).toBeDefined()
  })

  it('issues nothing when no directory is loaded', async () => {
    await store.dispatch('history/repairMissingJobs')

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })
})

describe('history/init', () => {
  let store: TypedStore

  beforeEach(async () => {
    store = createTestStore()

    await store.dispatch('history/reset')

    serverHistoryGetJob.mockReset()
  })

  it('repairs the loaded directories once the new page has landed', async () => {
    store.commit('files/setServerFilesGetDirectory', {
      path: 'gcodes',
      content: {
        dirs: [],
        files: [{ filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' }]
      }
    })

    vi.mocked(SocketActions.serverHistoryList).mockResolvedValue({ count: 0, jobs: [] })
    serverHistoryGetJob.mockResolvedValue({ job: createHistoryJob({ job_id: '00000f' }) })

    await store.dispatch('history/init')

    expect(serverHistoryGetJob).toHaveBeenCalledWith('00000f', { suppressError: true })
  })

  it('does not repair when the history list request failed', async () => {
    store.commit('files/setServerFilesGetDirectory', {
      path: 'gcodes',
      content: {
        dirs: [],
        files: [{ filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' }]
      }
    })

    vi.mocked(SocketActions.serverHistoryList).mockRejectedValue(new Error('Socket disconnected'))

    await store.dispatch('history/init')

    expect(serverHistoryGetJob).not.toHaveBeenCalled()
  })
})
