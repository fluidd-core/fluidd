import { ActionTree } from 'vuex'
import { WebcamConfig, WebcamsState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

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

  async onWebcamsChanged () {
    SocketActions.serverRead(undefined, 'cameras/reloadCameras', Globals.MOONRAKER_DB.webcams.NAMESPACE)
  }
}
