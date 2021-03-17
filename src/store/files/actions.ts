import { ActionTree } from 'vuex'
import { FilesState, KlipperFile, AppDirectory, FileChangeSocketResponse, FileUpdate, AppFileWithMeta, KlipperFileWithMeta, AppFile, DiskUsage } from './types'
import { RootState } from '../types'
import { formatAsFile, getFilePaths } from '../helpers'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'
import { HistoryItem } from '../history/types'

export const actions: ActionTree<FilesState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onServerFilesGetDirectory ({ commit, rootGetters }, payload: { disk_usage: DiskUsage; files: (KlipperFile | KlipperFileWithMeta)[]; dirs: AppDirectory[]; __request__: any }) {
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
        modified: new Date().getTime()
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
          dir.modified = new Date(dir.modified).getTime()
          items.push(dir)
        }
      })
    }

    if (payload.files) {
      // If the history plugin is enabled, append our history data.
      const historyPluginSupport = rootGetters['server/pluginSupport']('history')
      const refs: { [index: string]: number } = {}
      if (historyPluginSupport) {
        const history: HistoryItem[] = rootGetters['history/getHistory']

        // Iterate history once, recording if we found a file in our directory
        // list.
        for (const job of history) {
          if (
            job.exists &&
            !refs[job.filename]
          ) {
            const i = payload.files.findIndex(file => {
              const filepath = (pathNoRoot === '') ? file.filename : `${pathNoRoot}/${file.filename}`
              return job.filename === filepath
            })
            if (i >= 0) {
              refs[job.filename] = job.start_time
            }
          }
        }
      }

      payload.files.forEach((file) => {
        if (
          !Globals.FILTERED_FILES_PREFIX.some(e => file.filename.startsWith(e)) &&
          !Globals.FILTERED_FILES_EXTENSION.some(e => file.filename.endsWith(e))
        ) {
          const filepath = (pathNoRoot === '') ? file.filename : `${pathNoRoot}/${file.filename}`
          items.push({
            ...file,
            type: 'file',
            name: file.filename,
            extension: file.filename.split('.').pop() || '',
            modified: new Date(file.modified).getTime(),
            path: (pathNoRoot === '/') ? '' : pathNoRoot,
            start_time: (refs[filepath]) ? refs[filepath] : undefined
          })
        }
      })
    }
    commit('setDiskUsage', payload.disk_usage)
    commit('setServerFilesGetDirectory', { root, directory: { path, items } })
  },

  /**
   * This handles when a file is uploaded or metadata is updated for a file
   * in the browser, or the current file.
   */
  async onFileUpdate ({ commit, rootState }, payload: KlipperFile | KlipperFileWithMeta) {
    const root = 'gcodes' // We'd only ever load metadata for gcode files.
    const paths = getFilePaths(payload.filename, root)
    const file = formatAsFile(root, payload)

    // If this is an update to the currently printing file, then push it to
    // current_file.
    if (file.filename === rootState.printer?.printer.print_stats.filename) {
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

  async notifyUploadfile ({ commit }, payload: FileChangeSocketResponse) {
    const root = payload.item.root
    const file = formatAsFile(root, payload.item)
    if (file.extension === 'gcode') {
      // For gcode files, get the metadata and the meta update will take care of the rest.
      SocketActions.serverFilesMetaData(payload.item.path)
    } else {
      // For other files, just add it here.
      const paths = getFilePaths(payload.item.path, root)
      const update: FileUpdate = {
        paths,
        root,
        file
      }
      commit('setFileUpdate', update)
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
    commit('setFileDelete', update)
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
  },

  async addFileUpload ({ commit }, payload) {
    commit('setAddFileUpload', payload)
  },

  async updateFileUpload ({ commit }, payload) {
    commit('setUpdateFileUpload', payload)
  },

  async removeFileUpload ({ commit }, payload) {
    commit('setRemoveFileUpload', payload)
  },

  async updateCurrentPathByRoot ({ commit }, payload) {
    commit('setCurrentPath', payload)
  }

}
