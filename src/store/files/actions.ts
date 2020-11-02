import { ActionTree } from 'vuex'
import { FilesState, KlipperFile, Directory, Files } from './types'
import { FileChangeSocketResponse } from '../socket/types'
import { RootState } from '../types'
import { getFileListChangeInfo } from '../helpers'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<FilesState, RootState> = {
  async onServerFilesGetDirectory ({ commit }, payload) {
    const path = payload.__request__.params.path
    const root = payload.__request__.params.root
    let pathNoRoot = path.replace(root, '')
    if (pathNoRoot.startsWith('/')) pathNoRoot = pathNoRoot.substring(1)
    const items: (KlipperFile | Directory)[] = []
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
      payload.dirs.forEach((dir: Directory) => {
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
      payload.files.forEach((file: KlipperFile) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => file.filename.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => file.filename.endsWith(e))
        ) {
          if (root === 'gcodes') {
            SocketActions.serverFilesMetaData((pathNoRoot.length) ? `${pathNoRoot}/${file.filename}` : file.filename, path, file.filename)
          }
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

  async onServerFilesMetadata ({ state, commit }, payload) {
    const root = 'gcodes' // We'd only ever load metadata for gcode files.
    const path = payload.__request__.params.path // has the root in it.
    const filename = payload.__request__.params.name // should just be the filename
    const pathIndex = state[root].findIndex((f: Files) => (f.path === path))
    if (state[root][pathIndex] && state[root][pathIndex].items) {
      const fileIndex = state[root][pathIndex].items.findIndex(f => (f.type === 'file' && f.filename === filename))
      if (fileIndex >= 0) {
        commit('onFileMetaUpdate', { root, pathIndex, fileIndex, payload })
      }
    }
  },

  /**
   * The socket has notified that a file or folder has moved,
   * or - in the case of a folder, has been renamed.
   */
  async notifyMoveitem (_, payload: FileChangeSocketResponse) {
    // For now, we just refresh the two paths in question.
    // Perhaps later it might be more prudent to manually update the individual files...
    const info = getFileListChangeInfo(payload)
    SocketActions.serverFilesGetDirectory(info.root, info.destination.notifyPath)
    if (info.source) {
      SocketActions.serverFilesGetDirectory(info.root, info.source.notifyPath)
    }
  },

  async notifyUploadfile (_, payload: FileChangeSocketResponse) {
    const info = getFileListChangeInfo(payload)
    SocketActions.serverFilesGetDirectory(info.root, info.destination.notifyPath)
  },

  async notifyDeletefile (_, payload: FileChangeSocketResponse) {
    const info = getFileListChangeInfo(payload)
    SocketActions.serverFilesGetDirectory(info.root, info.destination.notifyPath)
  },

  async notifyCreatedir (_, payload: FileChangeSocketResponse) {
    const info = getFileListChangeInfo(payload)
    SocketActions.serverFilesGetDirectory(info.root, info.destination.notifyPath)
  },

  async notifyDeletedir (_, payload: FileChangeSocketResponse) {
    const info = getFileListChangeInfo(payload)
    SocketActions.serverFilesGetDirectory(info.root, info.destination.notifyPath)
  }
}
