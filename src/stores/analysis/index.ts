import { defineStore } from 'pinia'

export interface AnalysisState {
  status: Moonraker.Analysis.StatusResponse | null;
}

export const useAnalysisStore = defineStore('analysis', {
  state: (): AnalysisState => ({
    status: null,
  }),
  getters: {

  },
  actions: {
    onAnalysisStatus (payload: Moonraker.Analysis.StatusResponse) {
      if (payload) {
        this.status = payload
      }
    },
  }

})
