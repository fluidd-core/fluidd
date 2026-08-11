import { defineStore } from 'pinia'
import { SocketActions } from '@/api/socketActions'
import type { ObjectWithRequest } from '@/plugins/socketClient'

export const useAnalysisStore = defineStore('analysis', {
  actions: {
    async onAnalysisProcess (payload: ObjectWithRequest<Moonraker.Analysis.ProcessResponse>) {
      const { filename } = payload.__request__.params ?? {}

      if (!payload.bypassed) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }

})
