import type { ActionTree } from 'vuex'
import type { AnalysisState, AnalysisStatus, AnalysisProcess } from './types'
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

  async onAnalysisProcess (_, payload: ObjectWithRequest<AnalysisProcess>) {
    if (payload) {
      const { filename } = payload.__request__.params ?? {}

      if (!payload.bypassed) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }
}
