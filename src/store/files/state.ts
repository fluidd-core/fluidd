import type { FilesState } from './types'

export const defaultState = (): FilesState => {
  return {
    uploads: [],
    download: null,
    currentPaths: {},
    disk_usage: null,
    rootFiles: {},
    pathFiles: {}
  }
}

export const state = defaultState()
