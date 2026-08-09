import { SocketActions } from '@/api/socketActions'
import type { TypedStore } from '@/store'
import type { AppFileWithMeta, FileBrowserEntry } from '../types'
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

const getDirectoryResponse = (path: string, files: Record<string, unknown>[]) => ({
  disk_usage: { total: 0, used: 0, free: 0 },
  dirs: [],
  files,
  root_info: { name: 'gcodes' },
  __request__: { params: { path } }
})

describe('files actions - history decoration', () => {
  let store: TypedStore

  beforeEach(async () => {
    store = createTestStore()

    await store.dispatch('history/reset')

    serverHistoryGetJob.mockReset()
    serverHistoryGetJob.mockImplementation(async (uid: string) => ({
      job: createHistoryJob({ job_id: uid, filename: 'a.gcode', total_duration: 4321 })
    }))
  })

  describe('onServerFilesGetDirectory', () => {
    it('resolves the job of every file that names one', async () => {
      await store.dispatch('files/onServerFilesGetDirectory', getDirectoryResponse('gcodes', [
        { filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' },
        { filename: 'b.gcode', modified: 0, size: 1, job_id: '000010' }
      ]))

      await vi.waitFor(() => {
        expect(serverHistoryGetJob).toHaveBeenCalledTimes(2)
      })

      expect(serverHistoryGetJob).toHaveBeenCalledWith('00000f', { suppressError: true })
      expect(serverHistoryGetJob).toHaveBeenCalledWith('000010', { suppressError: true })
    })

    it('issues nothing for a directory of files that never printed', async () => {
      const actions: string[] = []
      const unsubscribe = store.subscribeAction(({ type }) => actions.push(type))

      await store.dispatch('files/onServerFilesGetDirectory', getDirectoryResponse('gcodes', [
        { filename: 'a.gcode', modified: 0, size: 1 },
        { filename: 'b.gcode', modified: 0, size: 1, job_id: null }
      ]))

      unsubscribe()

      expect(actions).not.toContain('history/fetchMissingJobs')
      expect(serverHistoryGetJob).not.toHaveBeenCalled()
    })
  })

  describe('onFileMetaData', () => {
    it('resolves the job of a single file', async () => {
      await store.dispatch('files/onFileMetaData', {
        filename: 'a.gcode',
        modified: 0,
        size: 1,
        job_id: '00000f'
      })

      await vi.waitFor(() => {
        expect(serverHistoryGetJob).toHaveBeenCalledWith('00000f', { suppressError: true })
      })
    })

    it('issues nothing for a file that never printed', async () => {
      await store.dispatch('files/onFileMetaData', {
        filename: 'a.gcode',
        modified: 0,
        size: 1
      })

      expect(serverHistoryGetJob).not.toHaveBeenCalled()
    })
  })

  describe('getDirectory', () => {
    const getFileEntry = (filename: string): AppFileWithMeta | undefined => {
      const items: FileBrowserEntry[] = store.getters['files/getDirectory']('gcodes')

      return items.find((item): item is AppFileWithMeta =>
        item.type === 'file' && item.name === filename
      )
    }

    it('populates history for a file whose job is outside the loaded page', async () => {
      // The loaded page holds a different job entirely - exactly the case the
      // browser used to render blank.
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001' })]
      })

      await store.dispatch('files/onServerFilesGetDirectory', getDirectoryResponse('gcodes', [
        { filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' }
      ]))

      await vi.waitFor(() => {
        expect(getFileEntry('a.gcode')?.history).toBeDefined()
      })

      const history = getFileEntry('a.gcode')?.history

      expect(history?.job_id).toBe('00000f')
      expect(history?.status).toBe('completed')
      expect(history?.total_duration).toBe(4321)
    })

    it('leaves history unset for a file whose job was deleted', async () => {
      serverHistoryGetJob.mockRejectedValue({ code: 404, message: 'Invalid job uid: 00000f' })

      await store.dispatch('files/onServerFilesGetDirectory', getDirectoryResponse('gcodes', [
        { filename: 'a.gcode', modified: 0, size: 1, job_id: '00000f' }
      ]))

      await vi.waitFor(() => {
        expect(store.state.history.missingJobIds['00000f']).toBe(true)
      })

      expect(getFileEntry('a.gcode')?.history).toBeUndefined()
    })
  })
})
