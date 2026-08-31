import { defineStore } from 'pinia'
import { SocketActions } from '@/api/socketActions'

export const useAnalysisStore = defineStore('analysis', {
  actions: {
    async process (filename: string, estimatorConfig?: string, force?: boolean) {
      const { bypassed } = await SocketActions.serverAnalysisProcess(filename, estimatorConfig, force)

      if (!bypassed) {
        SocketActions.serverFilesMetadata(filename)
      }
    }
  }
})
