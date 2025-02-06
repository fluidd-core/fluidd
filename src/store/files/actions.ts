import type { ActionTree } from 'vuex'
import type { FilesState, KlipperFile, KlipperDir, FileChangeSocketResponse, KlipperFileWithMeta, DiskUsage, FileChangeItem, FilePaths } from './types'
import type { RootState } from '../types'
import getFilePaths from '@/util/get-file-paths'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

const itemAsKlipperFile = (item: FileChangeItem, paths: FilePaths): KlipperFile => ({
  filename: paths.filename,
  modified: item.modified,
  size: item.size,
  permissions: item.permissions
})

const itemAsKlipperDir = (item: FileChangeItem, paths: FilePaths): KlipperDir => ({
  dirname: paths.filename,
  modified: item.modified,
  size: item.size,
  permissions: item.permissions
})

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
        !Globals.FILTERED_FOLDER_NAMES.includes(file.dirname) &&
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
  async onFileMetaData ({ commit }, payload: KlipperFileWithMeta) {
    const paths = getFilePaths(payload.filename, 'gcodes')

    if (!paths.filtered) {
      commit('setFileUpdate', { paths, file: payload })
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
  async notifyRootUpdate ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root

    commit('setResetRoot', root)

    SocketActions.serverFilesGetDirectory(root)
  },

  async notifyModifyFile ({ dispatch }, payload: FileChangeSocketResponse) { dispatch('notifyCreateFile', payload) },

  async notifyCreateFile ({ commit, dispatch, rootState }, payload: FileChangeSocketResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      if (
        paths.root === 'gcodes' &&
        paths.extension === '.gcode'
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
        const file = itemAsKlipperFile(payload.item, paths)

        commit('setFileUpdate', { paths, file })
      }
    }
  },

  async notifyCreateDir ({ commit }, payload: FileChangeSocketResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      const dir = itemAsKlipperDir(payload.item, paths)

      commit('setDirUpdate', { paths, dir })
    }
  },

  async notifyMoveFile ({ commit }, payload: FileChangeSocketResponse) {
    const { item, source_item } = payload

    const paths = getFilePaths(item.path, item.root)

    if (!paths.filtered) {
      const file = itemAsKlipperFile(payload.item, paths)

      commit('setFileUpdate', { paths, file })
    }

    if (source_item) {
      const sourcePaths = getFilePaths(source_item.path, source_item.root)

      if (!sourcePaths.filtered) {
        commit('setFileDelete', sourcePaths)
      }
    }
  },

  async notifyMoveDir ({ commit }, payload: FileChangeSocketResponse) {
    const { item, source_item } = payload

    const paths = getFilePaths(item.path, item.root)

    if (!paths.filtered) {
      const dir = itemAsKlipperDir(payload.item, paths)

      commit('setDirUpdate', { paths, dir })
    }

    if (source_item) {
      const sourcePaths = getFilePaths(source_item.path, source_item.root)

      if (!sourcePaths.filtered) {
        commit('setDirDelete', sourcePaths)

        commit('setPathDelete', sourcePaths.rootPathFilename)
      }
    }
  },

  async notifyDeleteFile ({ commit }, payload: FileChangeSocketResponse) {
    const paths = getFilePaths(payload.item.path, payload.item.root)

    if (!paths.filtered) {
      commit('setFileDelete', paths)
    }
  },

  async notifyDeleteDir ({ commit }, payload: FileChangeSocketResponse) {
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
}
