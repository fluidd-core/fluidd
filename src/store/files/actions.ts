import type { ActionTree } from 'vuex'
import type { FilesState, FilePaths } from './types'
import type { RootState } from '../types'
import getFilePaths from '@/util/get-file-paths'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import type { ObjectWithRequest } from '@/plugins/socketClient'

const itemAsMoonrakerFile = (item: Moonraker.Files.ChangeItem, paths: FilePaths): Moonraker.Files.File => ({
  filename: paths.filename,
  modified: item.modified,
  size: item.size,
  permissions: item.permissions
})

const itemAsMoonrakerDir = (item: Moonraker.Files.ChangeItem, paths: FilePaths): Moonraker.Files.Dir => ({
  dirname: paths.filename,
  modified: item.modified,
  size: item.size,
  permissions: item.permissions
})

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onServerFilesGetDirectory ({ commit }, payload: ObjectWithRequest<Moonraker.Files.GetDirectoryResponse>) {
    const { disk_usage, files, dirs } = payload
    const { path } = payload.__request__.params ?? {}
    const [root] = path.split('/', 1)

    const filteredDirs = dirs
      .filter(file =>
        !Globals.FILTERED_FOLDER_NAMES.includes(file.dirname) &&
        !Globals.FILTERED_FILES_PREFIX.some(e => file.dirname.startsWith(e)) &&
        !Globals.FILTERED_FILES_EXTENSION.some(e => file.dirname.endsWith(e))
      )

    commit('setDiskUsage', { root, disk_usage })
    commit('setServerFilesGetDirectory', { path, content: { files, dirs: filteredDirs } })
  },

  async onServerFilesListRoot ({ commit }, payload: ObjectWithRequest<Moonraker.Files.ListRootResponse>) {
    const { root } = payload.__request__.params ?? {}

    commit('setServerFilesListRoot', { root, files: [...payload] })
  },

  /**
   * If we request the metadata (a file..) then we load and update here.
   */
  async onFileMetaData ({ commit }, payload: Moonraker.Files.FileWithMetaResponse) {
    const paths = getFilePaths(payload.filename, 'gcodes')

    if (!paths.filtered) {
      // We need to update filename here as it can contain a relative path
      const file: Moonraker.Files.FileWithMeta = {
        ...payload,
        filename: paths.filename
      }

      commit('setFileUpdate', { paths, file })
    }
  },

  /**
   * Automated notifications from moonraker.
   */

  // Old notifications for backwards compat
  async notifyCopyItem ({ dispatch }, payload) { dispatch('notifyCreateFile', payload) },
  async notifyMoveItem ({ dispatch }, payload) { dispatch('notifyMoveFile', payload) },
  async notifyUploadFile ({ dispatch }, payload) { dispatch('notifyCreateFile', payload) },

  // New notifications
  async notifyRootUpdate ({ commit }, payload: Moonraker.Files.ChangeResponse) {
    const root = payload.item.root

    commit('setResetRoot', root)

    SocketActions.serverFilesGetDirectory(root)
  },

  async notifyModifyFile ({ dispatch }, payload: Moonraker.Files.ChangeResponse) { dispatch('notifyCreateFile', payload) },

  async notifyCreateFile ({ commit, getters, dispatch, rootState }, payload: Moonraker.Files.ChangeResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      if (
        paths.root === 'gcodes' &&
        getters.getRootProperties('gcodes').accepts.includes(paths.extension)
      ) {
        // If the file in the gcode preview is the same as the one being updated, then reset gcode preview
        const gcodePreviewFile = rootState.gcodePreview.file

        if (
          gcodePreviewFile &&
          gcodePreviewFile.path === paths.path &&
          gcodePreviewFile.filename === paths.filename
        ) {
          dispatch('gcodePreview/reset', undefined, { root: true })
        }

        // For gcode files, get the metadata and the meta update will take care of the rest.
        SocketActions.serverFilesMetadata(paths.pathFilename)
      } else {
        const file = itemAsMoonrakerFile(payload.item, paths)

        commit('setFileUpdate', { paths, file })
      }
    }
  },

  async notifyCreateDir ({ commit }, payload: Moonraker.Files.ChangeResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      const dir = itemAsMoonrakerDir(payload.item, paths)

      commit('setDirUpdate', { paths, dir })
    }
  },

  async notifyMoveFile ({ dispatch }, payload: Moonraker.Files.ChangeResponse) {
    const { item, source_item } = payload

    dispatch('notifyCreateFile', { item })

    dispatch('notifyDeleteFile', { item: source_item })
  },

  async notifyMoveDir ({ dispatch }, payload: Moonraker.Files.ChangeResponse) {
    const { item, source_item } = payload

    dispatch('notifyCreateDir', { item })

    dispatch('notifyDeleteDir', { item: source_item })
  },

  async notifyDeleteFile ({ commit }, payload: Moonraker.Files.ChangeResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      commit('setFileDelete', paths)
    }
  },

  async notifyDeleteDir ({ commit }, payload: Moonraker.Files.ChangeResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      commit('setDirDelete', paths)

      commit('setPathDelete', paths.rootPathFilename)
    }
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
} satisfies ActionTree<FilesState, RootState>
