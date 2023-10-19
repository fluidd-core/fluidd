import type { FilesState } from './types'

export const defaultState = (): FilesState => {
  return {
    uploads: [],
    download: null,
    currentPaths: {},
    disk_usage: {
      total: 0,
      used: 0,
      free: 0
    },
    rootFiles: {},
    pathFiles: {}
  }
}

export const state = defaultState()
