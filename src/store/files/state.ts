import type { FilesState } from './types'

export const state = (): FilesState => {
  return {
    uploads: [],
    download: null,
    roots: null,
    currentPaths: {},
    diskUsage: {},
    rootFiles: {},
    pathContent: {}
  }
}
