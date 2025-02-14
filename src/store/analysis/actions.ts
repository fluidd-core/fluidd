import type { ActionTree } from 'vuex'
import type { AnalysisState, AnalysisStatus, AnalysisEstimate } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import type { ObjectWithRequest } from '@/plugins/socketClient'

export const actions: ActionTree<AnalysisState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async onAnalysisStatus ({ commit }, payload: AnalysisStatus) {
    if (payload) {
      commit('setAnalysisStatus', payload)
    }
  },

  async onAnalysisEstimate (_, payload: ObjectWithRequest<AnalysisEstimate>) {
    if (payload) {
      const { filename, update_metadata } = payload.__request__.params ?? {}

      if (update_metadata) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }
}
