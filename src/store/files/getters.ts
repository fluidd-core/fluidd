import Vue from 'vue'
import type { GetterTree } from 'vuex'
import type { AppDirectory, AppFile, AppFileMeta, AppFileWithMeta, FileBrowserEntry, FilesState, RootProperties } from './types'
import type { RootState } from '../types'
import type { HistoryItem } from '../history/types'
import { SupportedImageFormats, SupportedMarkdownFormats, SupportedVideoFormats } from '@/globals'

export const getters: GetterTree<FilesState, RootState> = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state, getters, rootState, rootGetters) => (path: string) => {
    const pathContent = state.pathFiles[path]

    if (pathContent) {
      const items: FileBrowserEntry[] = []

      const [root, ...restOfPath] = path.split('/')
      const pathFilename = restOfPath.join('/')

      if (pathFilename !== '') {
        const item: AppDirectory = {
          type: 'directory',
          name: '..',
          dirname: '..',
          modified: 0,
          size: 0
        }

        items.push(item)
      }

      for (const dir of pathContent.dirs) {
        const item: AppDirectory = {
          ...dir,
          type: 'directory',
          name: dir.dirname,
          modified: new Date(dir.modified).getTime()
        }

        items.push(item)
      }

      // If root is timelapse, then add thumbnails data to files

      const timelapseThumbnailFiles = root === 'timelapse'
        ? new Set(pathContent.files
          .map(file => file.filename)
          .filter(filename => filename.endsWith('.jpg')))
        : undefined

      for (const file of pathContent.files) {
        const metadata: Partial<AppFileMeta> & Pick<AppFileWithMeta, 'history'> = {}

        if ('job_id' in file && file.job_id) {
          const history: HistoryItem | undefined = rootGetters['history/getHistoryById'](file.job_id)

          metadata.history = history
        }

        if ('filament_name' in file && file.filament_name) {
          metadata.filament_name = Vue.$filters.getStringArray(file.filament_name)
        }

        if ('filament_type' in file && file.filament_type) {
          metadata.filament_type = Vue.$filters.getStringArray(file.filament_type)
        }

        const extensionIndex = file.filename.lastIndexOf('.')
        const extension = extensionIndex > -1 ? file.filename.substring(extensionIndex) : ''

        if (timelapseThumbnailFiles && extension !== '.jpg') {
          const expectedThumbnailFile = `${file.filename.slice(0, -extension.length)}.jpg`

          if (timelapseThumbnailFiles.has(expectedThumbnailFile)) {
            metadata.thumbnails = [
              {
                // we have no data regarding the thumbnail other than it's URL, but setting it is mandatory...
                height: 0,
                width: 0,
                size: 0,
                relative_path: expectedThumbnailFile
              }
            ]
          }
        }

        const item: AppFile | AppFileWithMeta = {
          ...file,
          ...metadata,
          type: 'file',
          name: file.filename,
          extension,
          path: pathFilename,
          modified: new Date(file.modified).getTime()
        }

        items.push(item)
      }

      return items
    }
  },

  getRootFiles: (state) => (root: string) => {
    return state.rootFiles[root]
  },

  /**
   * Indicates if a root is available.
   */
  isRootAvailable: (state, getters, rootState) => (root: string) => {
    return rootState.server.info.registered_directories.includes(root)
  },

  /**
   * Returns the properties of a root.
   */
  getRootProperties: () => (root: string): RootProperties => {
    const canView = [
      ...SupportedImageFormats,
      ...SupportedMarkdownFormats,
      ...SupportedVideoFormats
    ]

    switch (root) {
      case 'gcodes':
        return {
          readonly: false,
          accepts: ['.gcode', '.g', '.gc', '.gco', '.ufp', '.nc'],
          canView,
          canConfigure: true,
          filterTypes: ['print_start_time', 'hidden_files', 'moonraker_temporary_upload_files']
        }
      case 'config':
        return {
          readonly: false,
          accepts: ['.conf', '.cfg', '.md', '.css', '.jpg', '.jpeg', '.png', '.gif'],
          canView,
          canConfigure: false,
          filterTypes: ['hidden_files', 'klipper_backup_files', 'moonraker_backup_files', 'moonraker_temporary_upload_files', 'crowsnest_backup_files']
        }
      case 'config_examples':
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ['hidden_files']
        }
      case 'docs':
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ['hidden_files']
        }
      case 'logs':
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ['hidden_files', 'rolled_log_files']
        }
      case 'timelapse':
        return {
          readonly: false,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ['hidden_files', 'moonraker_temporary_upload_files']
        }
      default:
        return {
          readonly: true,
          accepts: [],
          canView: [],
          canConfigure: false,
          filterTypes: ['hidden_files']
        }
    }
  },

  /**
   * Returns a specific file.
   */
  getFile: (state, getters, rootState, rootGetters) => (path: string, filename: string) => {
    const pathContent = state.pathFiles[path]

    const file = pathContent?.files.find(file => file.filename === filename)

    if (file) {
      const metadata: Partial<AppFileMeta> & Pick<AppFileWithMeta, 'history'> = {}

      if ('job_id' in file && file.job_id) {
        const history: HistoryItem | undefined = rootGetters['history/getHistoryById'](file.job_id)

        metadata.history = history
      }

      if ('filament_name' in file && file.filament_name) {
        metadata.filament_name = Vue.$filters.getStringArray(file.filament_name)
      }

      if ('filament_type' in file && file.filament_type) {
        metadata.filament_type = Vue.$filters.getStringArray(file.filament_type)
      }

      const [, ...restOfPath] = path.split('/')
      const pathFilename = restOfPath.join('/')

      const extensionIndex = filename.lastIndexOf('.')
      const extension = extensionIndex > -1 ? filename.substring(extensionIndex) : ''

      const item: AppFile | AppFileWithMeta = {
        ...file,
        ...metadata,
        type: 'file',
        name: file.filename,
        extension,
        path: pathFilename,
        modified: new Date(file.modified).getDate()
      }

      return item
    }
  },

  /**
   * Gets the currently stored path for any given root.
   */
  getCurrentPathByRoot: (state) => (r: string) => {
    return state.currentPaths[r] || ''
  },

  /**
   * Returns a boolean indicating if we're low on disk space.
   */
  getLowOnSpace: (state) => {
    // 1073741824 = 1gb
    return state.disk_usage != null && state.disk_usage.free < 1073741824
  }
}
