import Vue from 'vue'
import type { GetterTree } from 'vuex'
import type { AppDirectory, AppDiskUsage, AppFile, AppFileMeta, AppFileWithMeta, FileBrowserEntry, FilesState, RootProperties } from './types'
import type { RootState } from '../types'
import type { HistoryItem } from '../history/types'
import { SupportedImageFormats, SupportedMarkdownFormats, SupportedVideoFormats } from '@/globals'

const toAppFileMetaWithHistory = (file: Moonraker.Files.File | Moonraker.Files.FileWithMeta, rootGetters: any) => {
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

  return metadata
}

export const getters = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state, getters, rootState, rootGetters) => (path: string) => {
    const pathContent = state.pathContent[path]

    if (pathContent && pathContent.partial !== true) {
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
          modified: Vue.$filters.moonrakerDateAsUnixTime(dir.modified)
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
        const metadata = toAppFileMetaWithHistory(file, rootGetters)

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
          modified: Vue.$filters.moonrakerDateAsUnixTime(file.modified)
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
  getFile: (state, getters, rootState, rootGetters) => (path: string, filename: string): AppFile | AppFileWithMeta | undefined => {
    const pathContent = state.pathContent[path]

    const file = pathContent?.files.find(file => file.filename === filename)

    if (file) {
      const metadata = toAppFileMetaWithHistory(file, rootGetters)

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
        modified: Vue.$filters.moonrakerDateAsUnixTime(file.modified)
      }

      return item
    }
  },

  /**
   * Gets the currently stored path for any given root.
   */
  getCurrentPathByRoot: (state) => (root: string) => {
    return state.currentPaths[root] ?? ''
  },

  getDiskUsage: (state) => (root: string): AppDiskUsage | undefined => {
    const diskUsage = state.diskUsage[root]

    if (diskUsage != null) {
      // 1073741824 = 1gb
      const lowOnSpace = diskUsage.free < Math.min(1073741824, diskUsage.total * 0.2)
      const usedPercent = Math.floor((diskUsage.used / diskUsage.total) * 100)

      return {
        ...diskUsage,
        usedPercent,
        lowOnSpace
      }
    }
  }
} satisfies GetterTree<FilesState, RootState>
