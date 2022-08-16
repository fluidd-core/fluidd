import { ActionTree } from 'vuex'
import { FilesState, KlipperFile, AppDirectory, FileChangeSocketResponse, FileUpdate, AppFileWithMeta, KlipperFileWithMeta, AppFile, DiskUsage } from './types'
import { RootState } from '../types'
import formatAsFile from '@/util/format-as-file'
import getFilePaths from '@/util/get-file-paths'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { HistoryItem } from '../history/types'

export const actions: ActionTree<FilesState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onServerFilesGetDirectory ({ commit, rootState }, payload: { disk_usage: DiskUsage; files: (KlipperFile | KlipperFileWithMeta)[]; dirs: AppDirectory[]; __request__: any }) {
    const path = payload.__request__.params.path
    const root = payload.__request__.params.root
    let pathNoRoot = path.replace(root, '')
    if (pathNoRoot.startsWith('/')) pathNoRoot = pathNoRoot.substring(1)

    const items: (AppFileWithMeta | AppFile | AppDirectory)[] = []

    if (path && path.indexOf('/') >= 0) {
      items.push({
        type: 'directory',
        dirname: '..',
        name: '..',
        size: 0,
        modified: null
      })
    }

    if (payload.dirs) {
      payload.dirs.forEach((dir) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => dir.dirname.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => dir.dirname.endsWith(e))
        ) {
          dir.type = 'directory'
          dir.name = dir.dirname
          dir.modified = (dir.modified) ? new Date(dir.modified).getTime() : null
          items.push(dir)
        }
      })
    }

    if (payload.files) {
      payload.files.forEach((file) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => file.filename.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => file.filename.endsWith(e))
        ) {
          let history = {} as HistoryItem
          if (file.job_id) {
            const h = rootState.history.jobs.find(job => job.job_id === file.job_id)
            if (h) history = h
          }
          items.push({
            ...file,
            type: 'file',
            name: file.filename,
            extension: file.filename.split('.').pop() || '',
            modified: new Date(file.modified).getTime(),
            path: (pathNoRoot === '/') ? '' : pathNoRoot,
            history
          })
        }
      })
    }
    commit('setDiskUsage', payload.disk_usage)
    commit('setServerFilesGetDirectory', { root, directory: { path, items } })
  },

  /**
   * If we request the metadata (a file..) then we load and update here.
   */
  async onFileMetaData ({ commit, rootState, rootGetters }, payload: KlipperFile | KlipperFileWithMeta) {
    const root = 'gcodes' // We'd only ever load metadata for gcode files.
    const paths = getFilePaths(payload.filename, root)
    let file = formatAsFile(root, payload)
    const filepath = (file.path) ? `${file.path}/${file.filename}` : `${file.filename}`

    // If this is an update to the currently printing file, then push it to
    // current_file.
    if (filepath === rootState.printer.printer.print_stats.filename) {
      // Find an completed history item for this file, if it exists.
      const history = rootGetters['history/getHistoryByFilename'](filepath)
      if (history) {
        file = {
          ...file,
          history
        }
      }
      commit('printer/setSocketNotify', { key: 'current_file', payload: file }, { root: true })
    }

    // Apply the metadata to our specific file.
    const update: FileUpdate = {
      paths,
      root,
      file
    }
    commit('setFileUpdate', update)
  },

  /**
   * Automated notifications from moonraker.
   */

  // Old notifications for backwards compat
  async notifyCopyItem ({ dispatch }, payload) { dispatch('notifyModifyFile', payload) },
  async notifyMoveItem ({ dispatch }, payload) { dispatch('notifyMoveFile', payload) },
  async notifyUploadFile ({ dispatch }, payload) { dispatch('notifyCreateFile', payload) },

  // New notifications
  async notifyRootUpdate ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    commit('setResetRoot', root)
    SocketActions.serverFilesGetDirectory(root, root)
  },

  async notifyModifyFile (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const itemPaths = getFilePaths(payload.item.path, root)

    SocketActions.serverFilesGetDirectory(root, itemPaths.rootPath)
    if (payload.source_item) {
      const sourcePaths = getFilePaths(payload.source_item.path, root)
      if (itemPaths.rootPath !== sourcePaths.rootPath) {
        SocketActions.serverFilesGetDirectory(root, sourcePaths.rootPath)
      }
    }
  },

  async notifyCreateFile ({ commit, dispatch, rootState }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const file = formatAsFile(root, payload.item)
    if (file.extension === 'gcode') {
      // If the file in the gcode preview is the same as the one being updated, then reset gcode preview
      const gcodePreviewFile = rootState.gcodePreview.file
      if (gcodePreviewFile && gcodePreviewFile.path === file.path && gcodePreviewFile.filename === file.filename) {
        dispatch('gcodePreview/reset', undefined, { root: true })
      }

      // For gcode files, get the metadata and the meta update will take care of the rest.
      SocketActions.serverFilesMetaData(payload.item.path)
    } else {
      const paths = getFilePaths(payload.item.path, root)
      const update: FileUpdate = {
        paths,
        root,
        file
      }
      commit('setFileUpdate', update)
    }
  },

  async notifyCreateDir (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    SocketActions.serverFilesGetDirectory(root, paths.rootPath)
  },

  async notifyMoveFile (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const itemPaths = getFilePaths(payload.item.path, root)

    SocketActions.serverFilesGetDirectory(root, itemPaths.rootPath)
    if (payload.source_item) {
      const sourcePaths = getFilePaths(payload.source_item.path, root)
      if (itemPaths.rootPath !== sourcePaths.rootPath) {
        SocketActions.serverFilesGetDirectory(root, sourcePaths.rootPath)
      }
    }
  },

  async notifyMoveDir (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const itemPaths = getFilePaths(payload.item.path, root)

    SocketActions.serverFilesGetDirectory(root, itemPaths.rootPath)
    if (payload.source_item) {
      const sourcePaths = getFilePaths(payload.source_item.path, root)
      if (itemPaths.rootPath !== sourcePaths.rootPath) {
        SocketActions.serverFilesGetDirectory(root, sourcePaths.rootPath)
      }
    }
  },

  async notifyDeleteFile ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    const file = formatAsFile(root, payload.item)
    const update: FileUpdate = {
      paths,
      root,
      file
    }
    commit('setItemDelete', update)
  },

  async notifyDeleteDir ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    const dir = formatAsFile(root, payload.item)
    const update: FileUpdate = {
      paths,
      root,
      file: dir
    }
    commit('setItemDelete', update)
    commit('setPathDelete', { path: `${paths.rootPath}/${paths.filename}`, root })
  },

  /**
   * Handles the state of current uploads and downloads.
   */
  async updateFileUpload ({ commit }, payload) {
    commit('setUpdateFileUpload', payload)
  },

  async removeFileUpload ({ commit }, payload) {
    commit('setRemoveFileUpload', payload)
  },

  async updateFileDownload ({ commit }, payload) {
    commit('setUpdateFileDownload', payload)
  },

  async removeFileDownload ({ commit }, payload) {
    commit('setRemoveFileDownload', payload)
  },

  async updateCurrentPathByRoot ({ commit }, payload) {
    commit('setCurrentPath', payload)
  }

}
