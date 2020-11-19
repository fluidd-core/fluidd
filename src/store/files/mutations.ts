import Vue from 'vue'
import { MutationTree } from 'vuex'
import { mergeFileUpdate } from '../helpers'
import { Files, FilesState, FileUpdate, KlipperFile, KlipperFileWithMeta } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<FilesState> = {
  resetState (state) {
    const newState = defaultState()
    Object.keys(newState).forEach((key: string) => {
      Vue.set(state, key, newState[key])
    })
  },

  onServerFilesGetDirectory (state, payload) {
    const path = payload.directory.path
    const i = state[payload.root].findIndex(o => o.path === path)
    if (i >= 0) {
      state[payload.root].splice(i, 1, payload.directory)
    } else {
      state[payload.root].push(payload.directory)
    }
  },

  onFileUpdate (state, payload: FileUpdate) {
    const root = payload.root
    const paths = payload.paths

    // Find relevant directory.
    const directory = state[root].find((f: Files) => (f.path === paths.rootPath))

    if (directory) {
      const fileIndex = directory.items.findIndex(file => file.name === paths.filename)
      const file = directory.items[fileIndex] as KlipperFile | KlipperFileWithMeta
      if (fileIndex >= 0) {
        Vue.set(directory.items, fileIndex, mergeFileUpdate(root, file, payload.file))
      } else {
        directory.items.push(payload.file)
      }
    }
  },

  onFileDelete (state, payload: FileUpdate) {
    const root = payload.root
    const paths = payload.paths

    // Find relevant directory.
    const directory = state[root].find((f: Files) => (f.path === paths.rootPath))
    if (directory) {
      const fileIndex = directory.items.findIndex(file => file.name === paths.filename)

      if (fileIndex >= 0) {
        directory.items.splice(fileIndex, 1)
      }
    }
  }

}
