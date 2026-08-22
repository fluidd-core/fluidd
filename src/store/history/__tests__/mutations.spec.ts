import type { TypedStore } from '@/store'
import type { HistoryState } from '../types'
import { createHistoryJob, createTestStore } from '@/../tests/unit/store'

describe('history mutations', () => {
  let store: TypedStore

  beforeEach(() => {
    store = createTestStore()
  })

  const historyState = (): HistoryState => store.state.history

  describe('setJobsById', () => {
    it('caches every job in one commit and freezes it', () => {
      store.commit('history/setJobsById', [
        createHistoryJob({ job_id: '00000f' }),
        createHistoryJob({ job_id: '000010' })
      ])

      expect(Object.keys(historyState().jobsById)).toStrictEqual(['00000f', '000010'])
      expect(Object.isFrozen(historyState().jobsById['00000f'])).toBe(true)
    })

    it('clears a negative entry for the same id', () => {
      store.commit('history/setMissingJobIds', ['00000f'])
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])

      expect(historyState().missingJobIds['00000f']).toBeUndefined()
    })
  })

  describe('setMissingJobIds', () => {
    it('records the ids and drops any cached job', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])
      store.commit('history/setMissingJobIds', ['00000f'])

      expect(historyState().missingJobIds['00000f']).toBe(true)
      expect(historyState().jobsById['00000f']).toBeUndefined()
    })
  })

  describe('setDeleteJob', () => {
    it('stops the file browser resolving a deleted job', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])

      expect(store.getters['history/getHistoryById']('00000f')).toBeDefined()

      store.commit('history/setDeleteJob', ['00000f'])

      expect(store.getters['history/getHistoryById']('00000f')).toBeUndefined()
      expect(historyState().missingJobIds['00000f']).toBe(true)
    })

    it('removes the job from the loaded page too', () => {
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001' })]
      })
      store.commit('history/setDeleteJob', ['000001'])

      expect(store.getters['history/getHistoryById']('000001')).toBeUndefined()
    })
  })

  describe('setAddHistory', () => {
    it('clears a negative entry, because moonraker reuses deleted job ids', () => {
      store.commit('history/setMissingJobIds', ['000001'])
      store.commit('history/setAddHistory', createHistoryJob({ job_id: '000001' }))

      expect(historyState().missingJobIds['000001']).toBeUndefined()
      expect(store.getters['history/getHistoryById']('000001')).toBeDefined()
    })
  })

  describe('setUpdateHistory', () => {
    it('clears a negative entry', () => {
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001', status: 'in_progress' })]
      })
      store.commit('history/setMissingJobIds', ['000001'])
      store.commit('history/setUpdateHistory', createHistoryJob({ job_id: '000001', status: 'completed' }))

      expect(historyState().missingJobIds['000001']).toBeUndefined()
      expect(store.getters['history/getHistoryById']('000001')?.status).toBe('completed')
    })
  })

  describe('setHistoryList', () => {
    it('prunes cache entries the new page covers, including negatives', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '000001' })])
      store.commit('history/setMissingJobIds', ['000002'])

      store.commit('history/setHistoryList', {
        count: 2,
        jobs: [
          createHistoryJob({ job_id: '000001' }),
          createHistoryJob({ job_id: '000002' })
        ]
      })

      expect(historyState().jobsById['000001']).toBeUndefined()
      expect(historyState().missingJobIds['000002']).toBeUndefined()
    })

    it('leaves cache entries the new page does not cover', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])

      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001' })]
      })

      expect(historyState().jobsById['00000f']).toBeDefined()
    })
  })

  describe('setClearMissingJobIds', () => {
    it('drops every negative entry and keeps the cached jobs', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])
      store.commit('history/setMissingJobIds', ['000010'])

      store.commit('history/setClearMissingJobIds')

      expect(historyState().missingJobIds).toStrictEqual({})
      expect(historyState().jobsById['00000f']).toBeDefined()
    })
  })

  describe('setReset', () => {
    it('clears both caches', () => {
      store.commit('history/setJobsById', [createHistoryJob({ job_id: '00000f' })])
      store.commit('history/setMissingJobIds', ['000010'])

      store.commit('history/setReset')

      expect(historyState().jobsById).toStrictEqual({})
      expect(historyState().missingJobIds).toStrictEqual({})
    })
  })
})
