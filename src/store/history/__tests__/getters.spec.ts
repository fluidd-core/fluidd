import type { TypedStore } from '@/store'
import type { HistoryItem } from '../types'
import { createHistoryJob, createTestStore } from '@/../tests/unit/store'

describe('history getters', () => {
  let store: TypedStore

  beforeEach(() => {
    store = createTestStore()
  })

  const getHistoryById = (jobId: string): HistoryItem | undefined =>
    store.getters['history/getHistoryById'](jobId)

  describe('getHistoryById', () => {
    it('resolves a job in the loaded page', () => {
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001', filename: 'loaded.gcode' })]
      })

      expect(getHistoryById('000001')?.filename).toBe('loaded.gcode')
    })

    it('resolves a job that is only in the cache', () => {
      store.commit('history/setJobsById', [
        createHistoryJob({ job_id: '00000f', filename: 'fetched.gcode' })
      ])

      expect(getHistoryById('00000f')?.filename).toBe('fetched.gcode')
    })

    it('normalizes a cached job the same way as a loaded one', () => {
      store.commit('history/setJobsById', [
        createHistoryJob({
          job_id: '00000f',
          metadata: {
            modified: '2026-08-09T12:00:00.000Z',
            size: 1024,
            filament_name: 'Black PLA;Red PLA'
          }
        })
      ])

      const metadata = getHistoryById('00000f')?.metadata

      expect(metadata?.modified).toBe(1786276800)
      expect(metadata?.filament_name).toStrictEqual(['Black PLA', 'Red PLA'])
    })

    it('returns undefined when the job is in neither', () => {
      expect(getHistoryById('00000f')).toBeUndefined()
    })

    it('prefers the loaded page over the cache', () => {
      store.commit('history/setJobsById', [
        createHistoryJob({ job_id: '000001', filename: 'stale.gcode' })
      ])
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001', filename: 'fresh.gcode' })]
      })

      expect(getHistoryById('000001')?.filename).toBe('fresh.gcode')
    })
  })

  describe('getHistory', () => {
    it('does not include individually fetched jobs', () => {
      store.commit('history/setHistoryList', {
        count: 1,
        jobs: [createHistoryJob({ job_id: '000001' })]
      })
      store.commit('history/setJobsById', [
        createHistoryJob({ job_id: '00000f' })
      ])

      const history: HistoryItem[] = store.getters['history/getHistory']

      expect(history.map(job => job.job_id)).toStrictEqual(['000001'])
    })

    it('sorts by start time, newest first', () => {
      store.commit('history/setHistoryList', {
        count: 2,
        jobs: [
          createHistoryJob({ job_id: '000001', start_time: 100 }),
          createHistoryJob({ job_id: '000002', start_time: 200 })
        ]
      })

      const history: HistoryItem[] = store.getters['history/getHistory']

      expect(history.map(job => job.job_id)).toStrictEqual(['000002', '000001'])
    })
  })
})
