import Vue from 'vue'
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
  },

  onFileMetaUpdate (state, payload) {
    const root = payload.root
    const pathIndex = payload.pathIndex
    const fileIndex = payload.fileIndex
    const file = state[root][pathIndex].items[fileIndex]
    Vue.set(state[root][pathIndex].items, fileIndex, { ...file, ...payload.payload })
  }

}
