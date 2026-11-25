import type { ActionTree } from 'vuex'
import { SocketActions } from '@/api/socketActions'
import type { ObjectWithRequest } from '@/plugins/socketClient'
import type { RootState } from '../types'
import type { AnalysisState } from './types'

export const actions = {
  async reset({ commit }) {
    commit('setReset')
  },

  async onAnalysisStatus({ commit }, payload: Moonraker.Analysis.StatusResponse) {
    if (payload) {
      commit('setAnalysisStatus', payload)
    }
  },

  async onAnalysisProcess(_, payload: ObjectWithRequest<'server.analysis.process'>) {
    if (payload) {
      const { filename } = payload.__request__.params

      if (!payload.bypassed) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }
} satisfies ActionTree<AnalysisState, RootState>
