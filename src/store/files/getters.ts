import { GetterTree } from 'vuex'
import { FilesState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<FilesState, RootState> = {
  getDirectory: (state) => (r: string, path: string) => {
    const root = r as 'gcodes' | 'config' | 'config_examples'
    if (state && state[root]) {
      const dir = state[root].find(o => o.path === path)
      if (dir) {
        return dir
      }
    }
    return []
  },

  isRootAvailable: (state) => (r: string) => {
    return state.availableRoots.includes(r)
  }
}
