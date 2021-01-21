import Vue from 'vue'
import { MutationTree } from 'vuex'
import { mergeFileUpdate } from '../helpers'
import { Files, FilesState, FileUpdate, AppFile, AppFileWithMeta } from './types'
import { defaultState } from './index'
import { Globals } from '@/globals'

export const mutations: MutationTree<FilesState> = {
  resetState (state) {
    const newState = defaultState()
    Object.keys(newState).forEach((key: string) => {
      Vue.set(state, key, newState[key])
    })
  },

  onRegisteredDirectores (state, payload) {
    state.availableRoots = payload
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
      const file = directory.items[fileIndex] as AppFile | AppFileWithMeta

      const isFiltered = (
        Globals.FILTERED_FILES_PREFIX.some(e => payload.paths.filename.startsWith(e)) ||
        Globals.FILTERED_FILES_EXTENSION.some(e => payload.paths.filename.endsWith(e))
      )

      if (!isFiltered) {
        if (fileIndex >= 0) {
          Vue.set(directory.items, fileIndex, mergeFileUpdate(root, file, payload.file))
        } else {
          directory.items.push(mergeFileUpdate(root, {}, payload.file))
        }
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
