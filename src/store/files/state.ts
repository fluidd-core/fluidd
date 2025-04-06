import type { FilesState } from './types'

export const defaultState = (): FilesState => {
  return {
    uploads: [],
    download: null,
    currentPaths: {},
    diskUsage: {},
    rootFiles: {},
    pathContent: {}
  }
}

export const state = defaultState()
