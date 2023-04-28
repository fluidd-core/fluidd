import { GetterTree } from 'vuex'
import { AppDirectory, AppFile, AppFileWithMeta, FileBrowserEntry, FilesState } from './types'
import { RootState } from '../types'
import { HistoryItem } from '../history/types'

export const getters: GetterTree<FilesState, RootState> = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state, getters, rootState) => (path: string) => {
    const pathContent = state.pathFiles[path]

    if (pathContent) {
      const items: FileBrowserEntry[] = []

      const [root, ...restOfPath] = path.split('/')
      const pathNoRoot = restOfPath.join('/')

      if (pathNoRoot !== '') {
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
        const history = (file.job_id && rootState.history.jobs.find(job => job.job_id === file.job_id)) || {} as HistoryItem

        const item: AppFileWithMeta = {
          ...file,
          type: 'file',
          name: file.filename,
          extension: file.filename.split('.').pop() || '',
          path: pathNoRoot,
          modified: new Date(file.modified).getTime(),
          history
        }

        if (timelapseThumbnailFiles && item.extension !== 'jpg') {
          const expectedThumbnailFile = `${item.filename.slice(0, -(item.extension.length + 1))}.jpg`

          if (timelapseThumbnailFiles.has(expectedThumbnailFile)) {
            item.thumbnails = [
              {
                // we have no data regarding the thumbnail other than it's URL, but setting it is mandatory...
                data: '',
                height: 0,
                width: 0,
                size: 0,
                relative_path: expectedThumbnailFile
              }
            ]
          }
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
  isRootAvailable: (state, getters, rootState) => (r: string) => {
    return rootState.server.info.registered_directories.includes(r)
  },

  /**
   * Returns the properties of a root.
   */
  getRootProperties: () => (root: string) => {
    switch (root) {
      case 'gcodes':
        return {
          readonly: false,
          accepts: ['.gcode', '.g', '.gc', '.gco', '.ufp', '.nc'],
          canEdit: true,
          canView: false,
          canPrint: true,
          canConfigure: true,
          filterTypes: ['hidden_files', 'print_start_time']
        }
      case 'config':
        return {
          readonly: false,
          accepts: ['.conf', '.cfg', '.md', '.css', '.jpg', '.jpeg', '.png', '.gif'],
          canEdit: true,
          canView: false,
          canPrint: false,
          canConfigure: false,
          filterTypes: ['hidden_files', 'klipper_backup_files']
        }
      case 'config_examples':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: ['hidden_files']
        }
      case 'docs':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: ['hidden_files']
        }
      case 'logs':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: ['rolled_log_files']
        }
      case 'timelapse':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          canDelete: true,
          canCreateDirectory: true,
          filterTypes: ['hidden_files']
        }
      default:
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: []
        }
    }
  },

  /**
   * Returns a specific file.
   */
  getFile: (state) => (root: string, path: string, filename: string) => {
    const pathContent = state.pathFiles[path]

    const file = pathContent?.files.find(file => file.filename === filename)

    if (file) {
      const item: AppFile = {
        ...file,
        type: 'file',
        name: file.filename,
        extension: file.filename.split('.').pop() || '',
        path,
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
    return state.disk_usage.free < 1073741824
  },

  /**
   * Returns curent file system usage.
   */
  getUsage: (state) => {
    return state.disk_usage
  }
}
