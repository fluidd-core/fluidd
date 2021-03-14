import { GetterTree } from 'vuex'
import { Files, FilesState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<FilesState, RootState> = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state) => (r: string, path: string) => {
    const root = r as 'gcodes' | 'config' | 'config_examples'
    if (state && state[root]) {
      const dir = state[root].find(o => o.path === path)
      if (dir) {
        return dir
      }
    }
  },

  /**
   * Indicates if a root is available.
   */
  isRootAvailable: (state, getters, rootState) => (r: string) => {
    return rootState.server?.info.registered_directories.includes(r)
  },

  /**
   * Returns a specific file.
   */
  getFile: (state, getters) => (r: string, path: string, filename: string) => {
    const dir: Files = getters.getDirectory(r, path)
    console.log('found a dir', r, path, filename, dir)
    if (
      dir &&
      dir.items
    ) {
      return dir.items.find(f => f.type === 'file' && f.filename === filename)
    }
  }
}
