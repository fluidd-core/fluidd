import type { FilesState } from './types'

export const defaultState = (): FilesState => {
  return {
    uploads: [],
    download: null,
    currentPaths: {},
    diskUsage: null,
    rootFiles: {},
    pathContent: {}
  }
}

export const state = defaultState()
