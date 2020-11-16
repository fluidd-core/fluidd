import { ActionTree } from 'vuex'
import { FilesState, KlipperFile, AppDirectory, FileChangeSocketResponse, FileUpdate, AppFileWithMeta, KlipperFileWithMeta } from './types'
import { RootState } from '../types'
import { formatAsFile, getFilePaths } from '../helpers'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<FilesState, RootState> = {
  async onServerFilesGetDirectory ({ commit }, payload) {
    const path = payload.__request__.params.path
    const root = payload.__request__.params.root
    let pathNoRoot = path.replace(root, '')
    if (pathNoRoot.startsWith('/')) pathNoRoot = pathNoRoot.substring(1)
    const items: (AppFileWithMeta | AppDirectory)[] = []
    if (path && path.indexOf('/') >= 0) {
      items.push({
        type: 'directory',
        dirname: '..',
        name: '..',
        size: 0,
        modified: new Date().getTime()
      })
    }
    if (payload.dirs) {
      payload.dirs.forEach((dir: AppDirectory) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => dir.dirname.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => dir.dirname.endsWith(e))
        ) {
          dir.type = 'directory'
          dir.name = dir.dirname
          dir.modified = new Date(dir.modified).getTime()
          items.push(dir)
        }
      })
    }
    if (payload.files) {
      payload.files.forEach((file: AppFileWithMeta) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => file.filename.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => file.filename.endsWith(e))
        ) {
          file.type = 'file'
          file.name = file.filename
          file.extension = file.filename.split('.').pop() || ''
          file.modified = new Date(file.modified).getTime()
          items.push(file)
        }
      })
    }
    commit('onServerFilesGetDirectory', { root, directory: { path, items } })
  },

  /**
   * This handles when a file is uploaded or metadata is updated for a file
   * in the browser, or the current file.
   */
  async onFileUpdate ({ commit, rootState }, payload: KlipperFile | KlipperFileWithMeta) {
    const root = 'gcodes' // We'd only ever load metadata for gcode files.
    const paths = getFilePaths(payload.filename, root)
    console.log('got file update', payload)
    const file = formatAsFile(root, payload)

    // If this is an update to the currently printing file, then push it to
    // current_file.
    if (rootState.socket && file.filename === rootState.socket.printer.print_stats.filename) {
      commit('socket/onSocketNotify', { key: 'current_file', payload: file }, { root: true })
    }

    // Apply the metadata to our specific file.
    const update: FileUpdate = {
      paths,
      root,
      file
    }
    commit('onFileUpdate', update)
  },

  /**
   * The socket has notified that a file or folder has moved,
   * or - in the case of a folder, has been renamed.
   */
  async notifyCopyitem (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const itemPaths = getFilePaths(payload.item.path, root)

    SocketActions.serverFilesGetDirectory(root, itemPaths.rootPath)
    if (payload.source_item) {
      const sourcePaths = getFilePaths(payload.source_item.path, root)
      SocketActions.serverFilesGetDirectory(root, sourcePaths.rootPath)
    }
  },

  /**
   * Move a file or directory.
   */
  async notifyMoveitem (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const itemPaths = getFilePaths(payload.item.path, root)

    SocketActions.serverFilesGetDirectory(root, itemPaths.rootPath)
    if (payload.source_item) {
      const sourcePaths = getFilePaths(payload.source_item.path, root)
      SocketActions.serverFilesGetDirectory(root, sourcePaths.rootPath)
    }
  },

  async notifyUploadfile (_, payload: FileChangeSocketResponse) {
    console.log('notified if file upload', payload)
    const root = payload.item.root
    // const paths = getFilePaths(payload.item.path, root)
    const file = formatAsFile(root, payload.item)
    // const update: FileUpdate = {
    //   paths,
    //   root,
    //   file
    // }
    // commit('onFileUpdate', update)
    if (file.extension === 'gcode') {
      SocketActions.serverFilesMetaData(payload.item.path)
    }
  },

  async notifyDeletefile ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    const file = formatAsFile(root, payload.item)
    const update: FileUpdate = {
      paths,
      root,
      file
    }
    commit('onFileDelete', update)
  },

  async notifyCreatedir (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    SocketActions.serverFilesGetDirectory(root, paths.rootPath)
  },

  async notifyDeletedir (_, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const paths = getFilePaths(payload.item.path, root)
    SocketActions.serverFilesGetDirectory(root, paths.rootPath)
  }
}
