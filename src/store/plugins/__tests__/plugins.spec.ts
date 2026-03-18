import { getters } from '../getters'
import { mutations } from '../mutations'
import { defaultState } from '../state'

const mockServerFilesGet = vi.fn()

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverFilesGet: (...args: any[]) => mockServerFilesGet(...args)
  }
}))

import { actions } from '../actions'

describe('plugins store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('state', () => {
    it('returns default state', () => {
      const state = defaultState()
      expect(state.naviPoints).toEqual([])
      expect(state.naviPointsLoaded).toBe(false)
    })
  })

  describe('getters', () => {
    it('getNaviPoints returns naviPoints from state', () => {
      const state = {
        naviPoints: [
          { title: 'Test', href: '/test', target: '_self', icon: 'mdi-test', position: 1 }
        ],
        naviPointsLoaded: true
      }
      const result = getters.getNaviPoints(state, {} as any, {} as any, {} as any)
      expect(result).toEqual(state.naviPoints)
    })

    it('getNaviPointsLoaded returns loaded status from state', () => {
      const state = {
        naviPoints: [],
        naviPointsLoaded: true
      }
      const result = getters.getNaviPointsLoaded(state, {} as any, {} as any, {} as any)
      expect(result).toBe(true)
    })
  })

  describe('mutations', () => {
    it('setReset resets state', () => {
      const state = {
        naviPoints: [{ title: 'Test', href: '/test', target: '_self', icon: '', position: 1 }],
        naviPointsLoaded: true
      }
      mutations.setReset(state)
      expect(state.naviPoints).toEqual([])
      expect(state.naviPointsLoaded).toBe(false)
    })

    it('setNaviPoints sets naviPoints', () => {
      const state = defaultState()
      const points = [
        { title: 'KlipperFleet', href: '/klipperfleet.html', target: '_self', icon: 'mdi-fleet', position: 86 }
      ]
      mutations.setNaviPoints(state, points)
      expect(state.naviPoints).toEqual(points)
    })

    it('setNaviPointsLoaded sets loaded status', () => {
      const state = defaultState()
      mutations.setNaviPointsLoaded(state, true)
      expect(state.naviPointsLoaded).toBe(true)
    })
  })

  describe('actions', () => {
    it('reset dispatches setReset mutation', async () => {
      const commit = vi.fn()
      await (actions as any).reset({ commit })
      expect(commit).toHaveBeenCalledWith('setReset')
    })

    it('fetchNaviPoints fetches and sets navi points', async () => {
      const mockPoints = [
        { title: 'KlipperFleet', href: '/klipperfleet.html', target: '_self', icon: '', position: 86 }
      ]

      mockServerFilesGet.mockResolvedValue({
        data: mockPoints
      })

      const commit = vi.fn()
      const rootState = { config: { apiUrl: 'http://localhost' } }

      await (actions as any).fetchNaviPoints({ commit, rootState } as any)

      expect(commit).toHaveBeenCalledWith('setNaviPoints', expect.any(Array))
      expect(commit).toHaveBeenCalledWith('setNaviPointsLoaded', true)
    })

    it('fetchNaviPoints handles errors gracefully', async () => {
      mockServerFilesGet.mockRejectedValue(new Error('Not found'))

      const commit = vi.fn()
      const rootState = { config: { apiUrl: 'http://localhost' } }

      await (actions as any).fetchNaviPoints({ commit, rootState } as any)

      expect(commit).toHaveBeenCalledWith('setNaviPointsLoaded', true)
      expect(commit).not.toHaveBeenCalledWith('setNaviPoints', expect.any(Array))
    })
  })
})
