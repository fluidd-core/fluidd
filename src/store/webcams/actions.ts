import { ActionTree } from 'vuex'
import { WebcamConfig, WebcamsState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<WebcamsState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverWebcamsList()
  },

  async onWebcamsList ({ commit }, payload: { webcams: WebcamConfig[] }) {
    if (payload) {
      commit('setWebcamsList', payload)
    }
  },

  async onWebcamsChanged ({ dispatch }) {
    dispatch('cameras/reloadMoonrakerWebcamsNamespace', undefined, { root: true })
  }
}
