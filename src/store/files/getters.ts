import { GetterTree } from 'vuex'
import { AppFile, FileRoot, Files, FilesState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<FilesState, RootState> = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state) => (r: FileRoot, path: string) => {
    const root = r
    if (state && state[root]) {
      const dir = state[root].find(o => o.path === path)
      if (dir) {
        return dir
      }
    }
  },

  /**
   * Indicates if a root is available.
   */
  isRootAvailable: (state, getters, rootState) => (r: string) => {
    return rootState.server?.info.registered_directories.includes(r)
  },

  /**
   * Returns the properties of a root.
   */
  getRootProperties: () => (r: FileRoot) => {
    const root = r

    if (root === 'gcodes') {
      return {
        readonly: false,
        accepts: ['.gcode', '.g', '.gc', '.gco', '.ufp', '.nc'],
        canEdit: true,
        canView: false,
        canPrint: true,
        canConfigure: true
      }
    }

    if (root === 'config') {
      return {
        readonly: false,
        accepts: ['.conf', '.cfg', '.md'],
        canEdit: true,
        canView: false,
        canPrint: false,
        canConfigure: false
      }
    }

    if (root === 'config_examples') {
      return {
        readonly: true,
        accepts: [],
        canEdit: false,
        canView: true,
        canPrint: false,
        canConfigure: false
      }
    }

    if (root === 'docs') {
      return {
        readonly: true,
        accepts: [],
        canEdit: false,
        canView: true,
        canPrint: false,
        canConfigure: false
      }
    }

    if (root === 'logs') {
      return {
        readonly: true,
        accepts: [],
        canEdit: false,
        canView: true,
        canPrint: false,
        canConfigure: false
      }
    }

    if (root === 'timelapse') {
      return {
        readonly: true,
        accepts: [],
        canEdit: false,
        canView: true,
        canPrint: false,
        canConfigure: false,
        canDelete: true,
        canCreateDirectory: true
      }
    }

    return {
      readonly: true,
      accepts: [],
      canEdit: false,
      canView: true,
      canPrint: false,
      canConfigure: false
    }
  },

  /**
   * Returns a specific file.
   */
  getFile: (state, getters) => (r: string, path: string, filename: string): AppFile | undefined => {
    const dir: Files = getters.getDirectory(r, path)
    if (
      dir &&
      dir.items
    ) {
      const file = dir.items.find(f => f.type === 'file' && f.filename === filename)

      if (file) {
        return file as AppFile
      }
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
  },

  getStructure: () => (value: string | undefined) => {
    if (value === undefined) return []
    const lines = value.split(/\n/gi)
    value = ''
    for (let i = 0; i < lines.length; i++) {
      value += '|' + i + '|' + lines[i] + '\n'
    }
    const regex = /(\|\d+\|)#.*|#.*/gi
    value = value.replace(regex, '$1')
    const regex2 = /^\|\d+\|[ \f\r\t\v]*$\n/gim
    value = value.replace(regex2, '')
    value = value + '|0|['
    const regex3 = /\|(?<index>\d+)\|(\[(?<section>.*?)\]|(?<name>\w+):(?<value>[^[]*?)(?=\|\d+\|\w+:|\|\d+\|\[))/gim
    const matchArrays = [...value.matchAll(regex3)]
    const items = []
    // let section = null
    for (const index in matchArrays) {
      const groups = matchArrays[index].groups
      if (groups) {
        const section = groups.section
        let section_key = groups.section
        if (section) {
          section_key = section.split(' ')[0]
        }
        items.push({
          index: parseInt(groups.index) + 1,
          section: section,
          section_name: section_key,
          name: groups.name,
          value: groups.value
        })
      }
    }
    return items
  }
}
