import { FilesState } from './types'

export const defaultState = (): FilesState => {
  return {
    uploads: [],
    download: null,
    fileTransferCancelTokenSource: null,
    currentPaths: {},
    disk_usage: {
      total: 0,
      used: 0,
      free: 0
    },
    rootFiles: {
      gcodes: [],
      config: [],
      config_examples: [],
      docs: [],
      logs: [],
      timelapse: []
    },
    gcodes: [],
    config: [],
    config_examples: [],
    docs: [],
    logs: [],
    timelapse: []
  }
}

export const state = defaultState()
