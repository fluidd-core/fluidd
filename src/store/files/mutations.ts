import { MutationTree } from 'vuex'
import { FilesState } from './types'

export const mutations: MutationTree<FilesState> = {
  onServerFilesGetDirectory (state, payload) {
    const path = payload.directory.path
    const i = state[payload.root].findIndex(o => o.path === path)
    if (i >= 0) {
      state[payload.root].splice(i, 1, payload.directory)
    } else {
      state[payload.root].push(payload.directory)
    }
  }

  // removeDirectory (state, payload) {
  //   state[payload.root].splice(payload.index, 1)
  // }
}
