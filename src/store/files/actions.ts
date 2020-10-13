import { ActionTree } from 'vuex'
import { FilesState, File, Directory } from './types'
import { FileChangeSocketResponse } from '../socket/types'
import { RootState } from '../types'
import { getFileListChangeInfo } from '../helpers'
import { SocketActions } from '@/socketActions'

export const actions: ActionTree<FilesState, RootState> = {
  async onServerFilesGetDirectory ({ commit }, payload) {
    const path = payload.__request__.params.path
    const root = payload.__request__.params.root
    const items: (File|Directory)[] = []
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
        if (!dir.dirname.startsWith('.')) {
          dir.type = 'directory'
          dir.name = dir.dirname
          dir.modified = new Date(dir.modified).getTime()
          items.push(dir)
        }
      })
    }
    if (payload.files) {
      payload.files.forEach((file: File) => {
        if (!file.filename.startsWith('.')) {
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
