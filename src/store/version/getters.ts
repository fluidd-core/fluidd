import type { GetterTree } from 'vuex'
import type { CommitItem, VersionState } from './types'
import type { RootState } from '../types'
import { valid, gt } from 'semver'

export const getters: GetterTree<VersionState, RootState> = {
  /**
   * Returns an array list of available components
   */
  getVisibleComponents: (state) => {
    const o = Object.keys(state.version_info)
      .map(k => {
        const r = state.version_info[k]
        r.key = k
        return r
      })
      .sort((a, b) => a.key.localeCompare(b.key))

    return o
  },

  /**
   * Returns an object indicating if any component (but system) has an update.
   */
  hasUpdates: (state, getters, rootState) => {
    const enableNotifications = rootState.config.uiSettings.general.enableVersionNotifications

    return (
      enableNotifications &&
      Object.keys(state.version_info)
        .filter(component => component !== 'system')
        .some(getters.hasUpdate)
    )
  },

  /**
   * Returns a boolean indicating if a given component has an update.
   */
  hasUpdate: (state) => (component: string): boolean => {
    const componentVersionInfo = state.version_info[component]

    if ('name' in componentVersionInfo) {
      const version = valid(componentVersionInfo.version)
      const remoteVersion = valid(componentVersionInfo.remote_version)
      if (version && remoteVersion) {
        return gt(remoteVersion, version)
      }
    } else if ('package_count' in componentVersionInfo) {
      return componentVersionInfo.package_count > 0
    }

    if ('current_hash' in componentVersionInfo && 'remote_hash' in componentVersionInfo) {
      return componentVersionInfo.current_hash !== componentVersionInfo.remote_hash
    }

    return false
  },

  getResponses: (state) => {
    return [...state.responses]
  },

  /**
   * Returns commit history grouped by day.
   */
  getCommitHistory: (state) => (component: string) => {
    // This is only relevant for certain types.
    const componentVersionInfo = state.version_info[component]
    if (componentVersionInfo && 'git_messages' in componentVersionInfo) {
      const result = [...componentVersionInfo.commits_behind]
        .reduce((groups, commitItem) => {
          const dateAndTime = new Date(+commitItem.date * 1000)
          const dateOnly = +(new Date(dateAndTime.getFullYear(), dateAndTime.getMonth(), dateAndTime.getDate()))

          if (dateOnly in groups) {
            groups[dateOnly].push(commitItem)
          } else {
            groups[dateOnly] = [commitItem]
          }

          return groups
        }, {} as Record<number, CommitItem[]>)
      return {
        keys: Object
          .keys(result)
          .map(key => parseInt(key))
          .sort()
          .reverse(),
        result
      }
    }
  }
}
