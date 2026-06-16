import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { FilesState, MoonrakerPathContent, FilePaths, FileUpload, FileDownload } from './types'
import { defaultState } from './state'
import { Globals } from '@/globals'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setResetRoot (state, root: string) {
    const keysToDelete = Object.keys(state.pathContent)
      .filter(key => key === root || key.startsWith(`${root}/`))

    for (const key of keysToDelete) {
      Vue.delete(state.pathContent, key)
    }

    if (state.currentPaths[root]) {
      Vue.delete(state.currentPaths, root)
    }
  },

  setServerFilesGetDirectory (state, payload: { path: string, content: MoonrakerPathContent }) {
    const { path, content } = payload

    Vue.set(state.pathContent, path, content)
  },

  setServerFilesRoots (state, payload: Moonraker.Files.RootInfoWithPath[]) {
    state.roots = payload
  },

  setServerFilesListRoot (state, payload: { root: string, files: Moonraker.Files.RootFile[] }) {
    const { root, files } = payload

    Vue.set(state.rootFiles, root, files)
  },

  setFileUpdate (state, payload: { paths: FilePaths, file: Moonraker.Files.File | Moonraker.Files.FileWithMeta }) {
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

  setDirUpdate (state, payload: { paths: FilePaths, dir: Moonraker.Files.Dir }) {
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

  setUpdateFileUpload (state, payload: Partial<FileUpload> & { uid: string }) {
    const uploadIndex = state.uploads.findIndex(upload => upload.uid === payload.uid)

    if (uploadIndex >= 0) {
      Vue.set(state.uploads, uploadIndex, {
        ...state.uploads[uploadIndex],
        ...payload
      })
    } else {
      // The first update for a given uid always carries the full FileUpload shape
      // (abortController is the only field that may not be set yet).
      state.uploads.push(payload as FileUpload)
    }
  },

  setRemoveFileUpload (state, payload: string) {
    const i = state.uploads.findIndex((u) => u.uid === payload)
    if (i >= 0) {
      state.uploads.splice(i, 1)
    }
  },

  setUpdateFileDownload (state, payload: Partial<FileDownload> & { uid: string }) {
    if (
      state.download == null ||
      state.download.uid === payload.uid
    ) {
      // The first update for a given uid always carries the full FileDownload shape.
      state.download = {
        ...state.download,
        ...payload
      } as FileDownload
    }
  },

  setRemoveFileDownload (state, payload: string) {
    if (state.download?.uid === payload) {
      state.download = null
    }
  },

  setCurrentPath (state, payload: { root: string, path: string }) {
    Vue.set(state.currentPaths, payload.root, payload.path)
  },

  setDiskUsage (state, payload: { root: string, disk_usage: Moonraker.Files.DiskUsage }) {
    Vue.set(state.diskUsage, payload.root, payload.disk_usage)
  }
} satisfies MutationTree<FilesState>
