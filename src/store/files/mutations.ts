import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { FilesState, FileUpdate, MoonrakerRootFile, MoonrakerPathContent, KlipperFile } from './types'
import { defaultState } from './state'
import { Globals } from '@/globals'

export const mutations: MutationTree<FilesState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setResetRoot (state, root) {
    const keysToDelete = Object.keys(state.pathFiles)
      .filter(key => key === root || key.startsWith(`${root}/`))

    for (const key of keysToDelete) {
      Vue.delete(state.pathFiles, key)
    }

    if (state.currentPaths[root]) {
      Vue.set(state.currentPaths, root, undefined)
    }
  },

  setServerFilesGetDirectory (state, payload: { path: string, content: MoonrakerPathContent }) {
    const { path, content } = payload

    Vue.set(state.pathFiles, path, content)
  },

  setServerFilesListRoot (state, payload: { root: string, files: MoonrakerRootFile[] }) {
    const { root, files } = payload

    Vue.set(state.rootFiles, root, files)
  },

  setFileUpdate (state, payload: FileUpdate) {
    const { paths, file } = payload

    // Find relevant directory.
    const directory = state.pathFiles[paths.rootPath]

    if (directory) {
      const fileIndex = directory.files.findIndex(file => file.filename === paths.filename)
      const existingFile = directory.files[fileIndex]

      const isFiltered = (
        Globals.FILTERED_FILES_PREFIX.some(e => paths.filename.startsWith(e)) ||
        Globals.FILTERED_FILES_EXTENSION.some(e => paths.filename.endsWith(e))
      )

      if (!isFiltered) {
        if (fileIndex >= 0) {
          Vue.set(directory.files, fileIndex, { ...existingFile, ...file })
        } else {
          directory.files.push(file as KlipperFile)
        }
      }
    }
  },

  setItemDelete (state, payload: FileUpdate) {
    const { paths } = payload

    // Find relevant directory.
    const directory = state.pathFiles[paths.rootPath]

    if (directory) {
      const fileIndex = directory.files.findIndex(file => file.filename === paths.filename)

      if (fileIndex >= 0) {
        directory.files.splice(fileIndex, 1)
      } else {
        const dirIndex = directory.dirs.findIndex(file => file.dirname === paths.filename)

        if (dirIndex >= 0) {
          directory.dirs.splice(dirIndex, 1)
        }
      }
    }
  },

  setPathDelete (state, payload: { root: string, path: string }) {
    const { path } = payload

    // Find relevant directories.
    const keysToDelete = Object.keys(state.pathFiles)
      .filter(key => key === path || key.startsWith(`${path}/`))

    for (const key of keysToDelete) {
      Vue.delete(state.pathFiles, key)
    }
  },

  setUpdateFileUpload (state, payload) {
    const i = state.uploads.findIndex((u) => u.filepath === payload.filepath)
    if (i >= 0) {
      Vue.set(state.uploads, i, { ...state.uploads[i], ...payload })
    } else {
      state.uploads.push(payload)
    }
  },

  setRemoveFileUpload (state, payload) {
    const i = state.uploads.findIndex((u) => u.filepath === payload)
    if (i >= 0) {
      state.uploads.splice(i, 1)
    }
  },

  setUpdateFileDownload (state, payload) {
    state.download = {
      ...state.download,
      ...payload
    }
  },

  setRemoveFileDownload (state) {
    state.download = null
  },

  setCurrentPath (state, payload) {
    Vue.set(state.currentPaths, payload.root, payload.path)
  },

  setDiskUsage (state, payload) {
    Vue.set(state, 'disk_usage', payload)
  }

}
