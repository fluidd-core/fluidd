import Vue from 'vue'
import { MutationTree } from 'vuex'
import mergeFileUpdate from '@/util/merge-file-update'
import { Files, FilesState, FileUpdate, AppFile, AppFileWithMeta, FileRoot, QueueJob } from './types'
import { defaultState } from './index'
import { Globals } from '@/globals'

export const mutations: MutationTree<FilesState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setResetRoot (state, root) {
    Vue.set(state, root, [])
    if (state.currentPaths[root]) {
      Vue.set(state.currentPaths, root, undefined)
    }
  },

  setServerFilesGetDirectory (state, payload) {
    const path = payload.directory.path
    const root = payload.root as FileRoot
    const i = state[root].findIndex(o => o.path === path)
    if (i >= 0) {
      state[root].splice(i, 1, payload.directory)
    } else {
      state[root].push(payload.directory)
    }
  },

  setFileUpdate (state, payload: FileUpdate) {
    const root = payload.root as FileRoot
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

  setItemDelete (state, payload: FileUpdate) {
    const root = payload.root as FileRoot
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

  setPathDelete (state, payload: { root: string; path: string }) {
    const root = payload.root as 'gcodes' | 'config' | 'config_examples' | 'docs'
    const path = payload.path

    // Find relevant directories.
    const folders = state[root].filter(f => (f.path.startsWith(path)))
    folders.forEach((folder) => {
      const i = state[root].findIndex((f: Files) => (folder === f))
      if (i >= 0) {
        state[root].splice(i, 1)
      }
    })
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
    if (
      !state.download ||
      state.download === null
    ) {
      state.download = payload
    } else {
      state.download = {
        ...state.download,
        ...payload
      }
    }
  },

  setRemoveFileDownload (state) {
    state.download = null
  },

  setQueue (state, payload) {
    state.queue.jobs = [...payload.queued_jobs]
    state.queue.status = payload.queue_state
  },

  setDeleteJob (state, payload: string[]) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.queue.jobs.findIndex(job => job.job_id === job_id)
        if (i >= 0) state.queue.jobs.splice(i, 1)
      })
    }
  },

  setDeleteAllJobs (state) {
    Object.assign(state.queue, defaultState().queue)
  },

  setCurrentPath (state, payload) {
    Vue.set(state.currentPaths, payload.root, payload.path)
  },

  setDiskUsage (state, payload) {
    Vue.set(state, 'disk_usage', payload)
  }

}
