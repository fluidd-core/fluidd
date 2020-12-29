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
    const root = payload.root as 'gcodes' | 'config' | 'config_examples'
    const i = state[root].findIndex(o => o.path === path)
    if (i >= 0) {
      state[root].splice(i, 1, payload.directory)
    } else {
      state[root].push(payload.directory)
    }
  },

  onFileUpdate (state, payload: FileUpdate) {
    const root = payload.root as 'gcodes' | 'config' | 'config_examples'
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
    const root = payload.root as 'gcodes' | 'config' | 'config_examples'
    const paths = payload.paths

    // Find relevant directory.
    const directory = state[root].find((f: Files) => (f.path === paths.rootPath))
    if (directory) {
      const fileIndex = directory.items.findIndex(file => file.name === paths.filename)

      if (fileIndex >= 0) {
        directory.items.splice(fileIndex, 1)
      }
    }
  },

  addFileUpload (state, payload) {
    state.uploads.push({
      ...payload,
      processingComplete: false
    })
  },

  updateFileUpload (state, payload) {
    const i = state.uploads.findIndex((u) => u.filename === payload.filename)
    if (i >= 0) {
      console.log('updating it', { ...state.uploads[i], ...payload })
      Vue.set(state.uploads, i, { ...state.uploads[i], ...payload })
    }
  },

  removeFileUpload (state, payload) {
    const i = state.uploads.findIndex((u) => u.filename === payload)
    if (i >= 0) {
      state.uploads.splice(i, 1)
    }
  }

}
