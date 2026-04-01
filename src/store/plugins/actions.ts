import type { ActionTree } from 'vuex'
import type { PluginsState } from './types'
import type { RootState } from '../types'
import { httpClientActions } from '@/api/httpClientActions'

export const actions: ActionTree<PluginsState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async fetchNaviPoints ({ commit }) {
    try {
      const response = await httpClientActions.serverFilesGet<any>('config/.theme/navi.json')

      if (Array.isArray(response?.data)) {
        const points = response.data.map((item: any) => ({
          title: item.title ?? 'Unknown',
          href: item.href ?? '#',
          target: item.target ?? '_self',
          icon: item.icon ?? '',
          position: item.position ?? 999,
          visible: item.visible ?? true
        }))

        commit('setNaviPoints', points)
        commit('setNaviPointsLoaded', true)
      }
    } catch (err) {
      console.debug('Unable to fetch .theme/navi.json:', err)
      commit('setNaviPointsLoaded', true)
    }
  }
}
