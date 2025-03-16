import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { FilesState, MoonrakerRootFile, MoonrakerPathContent, MoonrakerFile, MoonrakerFileWithMeta, FilePaths, MoonrakerDir } from './types'
import { defaultState } from './state'
import { Globals } from '@/globals'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setResetRoot (state, root) {
    const keysToDelete = Object.keys(state.pathContent)
      .filter(key => key === root || key.startsWith(`${root}/`))

    for (const key of keysToDelete) {
      Vue.delete(state.pathContent, key)
    }

    if (state.currentPaths[root]) {
      Vue.set(state.currentPaths, root, undefined)
    }
  },

  setServerFilesGetDirectory (state, payload: { path: string, content: MoonrakerPathContent }) {
    const { path, content } = payload

    Vue.set(state.pathContent, path, content)
  },

  setServerFilesListRoot (state, payload: { root: string, files: MoonrakerRootFile[] }) {
    const { root, files } = payload

    Vue.set(state.rootFiles, root, files)
  },

  setFileUpdate (state, payload: { paths: FilePaths, file: MoonrakerFile | MoonrakerFileWithMeta }) {
    const { paths, file } = payload

    const isFiltered = (
      Globals.FILTERED_FILES_PREFIX.some(e => paths.filename.startsWith(e)) ||
      Globals.FILTERED_FILES_EXTENSION.some(e => paths.filename.endsWith(e))
    )

    if (!isFiltered) {
      // Find relevant directory.
      const directory = state.pathContent[paths.rootPath]

      if (directory) {
        const fileIndex = directory.files.findIndex(file => file.filename === paths.filename)

        if (fileIndex >= 0) {
          Vue.set(directory.files, fileIndex, file)
        } else {
          directory.files.push(file)
        }
      } else {
        const directory: MoonrakerPathContent = {
          partial: true,
          files: [file],
          dirs: []
        }

        Vue.set(state.pathContent, paths.rootPath, directory)
      }
    }
  },

  setDirUpdate (state, payload: { paths: FilePaths, dir: MoonrakerDir }) {
    const { paths, dir } = payload

    const isFiltered = (
      Globals.FILTERED_FILES_PREFIX.some(e => paths.filename.startsWith(e)) ||
      Globals.FILTERED_FILES_EXTENSION.some(e => paths.filename.endsWith(e))
    )

    if (!isFiltered) {
      // Find relevant directory.
      const directory = state.pathContent[paths.rootPath]

      if (directory) {
        const dirIndex = directory.dirs.findIndex(dir => dir.dirname === paths.filename)

        if (dirIndex >= 0) {
          Vue.set(directory.dirs, dirIndex, dir)
        } else {
          directory.dirs.push(dir)
        }
      }
    }
  },

  setFileDelete (state, payload: FilePaths) {
    // Find relevant directory.
    const directory = state.pathContent[payload.rootPath]

    if (directory) {
      const fileIndex = directory.files.findIndex(file => file.filename === payload.filename)

      if (fileIndex >= 0) {
        directory.files.splice(fileIndex, 1)
      }
    }
  },

  setDirDelete (state, payload: FilePaths) {
    // Find relevant directory.
    const directory = state.pathContent[payload.rootPath]

    if (directory) {
      const dirIndex = directory.dirs.findIndex(dir => dir.dirname === payload.filename)

      if (dirIndex >= 0) {
        directory.dirs.splice(dirIndex, 1)
      }
    }
  },

  setPathDelete (state, payload: string) {
    // Find relevant directories.
    const keysToDelete = Object.keys(state.pathContent)
      .filter(key => key === payload || key.startsWith(`${payload}/`))

    for (const key of keysToDelete) {
      Vue.delete(state.pathContent, key)
    }
  },

  setUpdateFileUpload (state, payload) {
    const uploadIndex = state.uploads.findIndex(upload => upload.uid === payload.uid)

    if (uploadIndex >= 0) {
      Vue.set(state.uploads, uploadIndex, {
        ...state.uploads[uploadIndex],
        ...payload
      })
    } else {
      state.uploads.push(payload)
    }
  },

  setRemoveFileUpload (state, payload: string) {
    const i = state.uploads.findIndex((u) => u.uid === payload)
    if (i >= 0) {
      state.uploads.splice(i, 1)
    }
  },

  setUpdateFileDownload (state, payload) {
    if (
      state.download == null ||
      state.download.uid === payload.uid
    ) {
      state.download = {
        ...state.download,
        ...payload
      }
    }
  },

  setRemoveFileDownload (state, payload: string) {
    if (state.download?.uid === payload) {
      state.download = null
    }
  },

  setCurrentPath (state, payload) {
    Vue.set(state.currentPaths, payload.root, payload.path)
  },

  setDiskUsage (state, payload) {
    Vue.set(state, 'diskUsage', payload)
  }
} satisfies MutationTree<FilesState>
