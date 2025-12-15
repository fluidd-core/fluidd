import type { ActionTree } from 'vuex'
import type { AnalysisState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import type { ObjectWithRequest } from '@/plugins/socketClient'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async onAnalysisStatus ({ commit }, payload: Moonraker.Analysis.StatusResponse) {
    if (payload) {
      commit('setAnalysisStatus', payload)
    }
  },

  async onAnalysisProcess (_, payload: ObjectWithRequest<Moonraker.Analysis.ProcessResponse>) {
    if (payload) {
      const { filename } = payload.__request__.params ?? {}

      if (!payload.bypassed) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }
} satisfies ActionTree<AnalysisState, RootState>
