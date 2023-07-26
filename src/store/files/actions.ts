import { ActionTree } from 'vuex'
import axios from 'axios'
import { FilesState, KlipperFile, KlipperDir, FileChangeSocketResponse, FileUpdate, KlipperFileWithMeta, DiskUsage } from './types'
import { RootState } from '../types'
import formatAsFile from '@/util/format-as-file'
import getFilePaths from '@/util/get-file-paths'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<FilesState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onServerFilesGetDirectory ({ commit }, payload: { disk_usage: DiskUsage; files: (KlipperFile | KlipperFileWithMeta)[]; dirs: KlipperDir[]; __request__: any }) {
    const { disk_usage, files, dirs, __request__: request } = payload
    const { path } = request.params

    const filteredDirs = dirs
      .filter(file =>
        !Globals.FILTERED_FILES_PREFIX.some(e => file.dirname.startsWith(e)) &&
        !Globals.FILTERED_FILES_EXTENSION.some(e => file.dirname.endsWith(e))
      )

    commit('setDiskUsage', disk_usage)
    commit('setServerFilesGetDirectory', { path, content: { files, dirs: filteredDirs } })
  },

  async onServerFilesListRoot ({ commit }, payload) {
    const { root } = payload.__request__.params

    commit('setServerFilesListRoot', { root, files: [...payload] })
  },

  /**
   * If we request the metadata (a file..) then we load and update here.
   */
  async onFileMetaData ({ commit, rootState }, payload: KlipperFile | KlipperFileWithMeta) {
    const root = 'gcodes' // We'd only ever load metadata for gcode files.
    const paths = getFilePaths(payload.filename, root)
    const file = formatAsFile(root, payload)
    const filepath = (file.path) ? `${file.path}/${file.filename}` : `${file.filename}`

    // If this is an update to the currently printing file, then push it to
    // current_file.
    if (filepath === rootState.printer.printer.print_stats.filename) {
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
    if (root === 'gcodes' && file.extension === 'gcode') {
      // If the file in the gcode preview is the same as the one being updated, then reset gcode preview
      const gcodePreviewFile = rootState.gcodePreview.file
      if (gcodePreviewFile && gcodePreviewFile.path === file.path && gcodePreviewFile.filename === file.filename) {
        dispatch('gcodePreview/reset', undefined, { root: true })
      }

      // For gcode files, get the metadata and the meta update will take care of the rest.
      SocketActions.serverFilesMetadata(payload.item.path)
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

  async createFileTransferCancelTokenSource ({ commit }) {
    const cancelTokenSource = axios.CancelToken.source()

    commit('setFileTransferCancelTokenSource', cancelTokenSource)
  },

  async cancelFileTransferWithTokenSource ({ commit, state }, cancellationMessage) {
    if (state.fileTransferCancelTokenSource) {
      state.fileTransferCancelTokenSource.cancel(cancellationMessage)
    }

    commit('setFileTransferCancelTokenSource', null)
  },

  async updateCurrentPathByRoot ({ commit }, payload) {
    commit('setCurrentPath', payload)
  }

}
