import type { FilesState } from './types'

export const createState = (): FilesState => {
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
