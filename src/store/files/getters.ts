import { GetterTree } from 'vuex'
import { FilesState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<FilesState, RootState> = {
  getDirectory: (state) => (root: string, path: string) => {
    if (state && state[root]) {
      const dir = state[root].find(o => o.path === path)
      if (dir) {
        return dir
      }
    }
    return []
  }
}
