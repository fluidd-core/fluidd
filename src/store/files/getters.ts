import { GetterTree } from 'vuex'
import { AppFile, AppFileWithMeta, FileRoot, Files, FilesState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<FilesState, RootState> = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state) => (root: FileRoot, path: string) => {
    const dir = state[root]?.find(o => o.path === path)

    return dir
  },

  getRootFiles: (state) => (root: FileRoot) => {
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
  getRootProperties: () => (root: FileRoot) => {
    switch (root) {
      case 'gcodes':
        return {
          readonly: false,
          accepts: ['.gcode', '.g', '.gc', '.gco', '.ufp', '.nc'],
          canEdit: true,
          canView: false,
          canPrint: true,
          canConfigure: true,
          filterTypes: ['print_start_time']
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
          filterTypes: []
        }
      case 'docs':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: []
        }
      case 'logs':
        return {
          readonly: true,
          accepts: [],
          canEdit: false,
          canView: true,
          canPrint: false,
          canConfigure: false,
          filterTypes: []
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
          filterTypes: []
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
  getFile: (state, getters) => (root: FileRoot, path: string, filename: string) => {
    const dir = getters.getDirectory(root, path) as Files | undefined

    const file = dir?.items?.find((item): item is AppFile | AppFileWithMeta => item.type === 'file' && item.filename === filename)

    return file
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
