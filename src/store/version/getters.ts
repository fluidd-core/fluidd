import type { GetterTree } from 'vuex'
import type { MoonrakerGitRepoCommit, VersionInfo, VersionState } from './types'
import type { RootState } from '../types'
import { valid, gt } from 'semver'

export const getters = {
  /**
   * Returns an array list of available components
   */
  getVisibleComponents: (state): VersionInfo[] => {
    const versionInfo = state.status?.version_info

    if (versionInfo != null) {
      return Object.entries(versionInfo)
        .map(([name, entry]): VersionInfo => {
          switch (entry.configured_type) {
            case null:
            case undefined:
            case 'system':
              return {
                ...entry,
                configured_type: 'system',
                name: entry.name || name
              }

            default:
              return {
                ...entry,
                name: entry.name || name
              }
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    return []
  },

  /**
   * Returns an object indicating if any component (but system) has an update.
   */
  hasUpdates: (state, getters, rootState) => {
    const enableNotifications = rootState.config.uiSettings.general.enableVersionNotifications

    return (
      enableNotifications &&
      state.status?.version_info != null &&
      Object.keys(state.status.version_info)
        .filter(name => name !== 'system')
        .some(getters.hasUpdate)
    )
  },

  /**
   * Returns a boolean indicating if a given component has an update.
   */
  hasUpdate: (state) => (name: string): boolean => {
    const versionInfo = state.status?.version_info[name]

    if (versionInfo != null) {
      if ('package_count' in versionInfo) {
        return versionInfo.package_count > 0
      }

      if ('version' in versionInfo && 'remote_version' in versionInfo) {
        const version = valid(versionInfo.version, { loose: true })
        const remoteVersion = valid(versionInfo.remote_version, { loose: true })

        if (version && remoteVersion) {
          return gt(remoteVersion, version, { loose: true })
        }
      }

      if ('current_hash' in versionInfo && 'remote_hash' in versionInfo) {
        return versionInfo.current_hash !== versionInfo.remote_hash
      }
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
    const versionInfo = state.status?.version_info[component]

    if (versionInfo && 'git_messages' in versionInfo) {
      const result = versionInfo.commits_behind
        .reduce<Record<number, MoonrakerGitRepoCommit[]>>((groups, commitItem) => {
          const dateAndTime = new Date(+commitItem.date * 1000)
          const dateOnly = +(new Date(dateAndTime.getFullYear(), dateAndTime.getMonth(), dateAndTime.getDate()))

          if (dateOnly in groups) {
            groups[dateOnly].push(commitItem)
          } else {
            groups[dateOnly] = [commitItem]
          }

          return groups
        }, {})
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
} satisfies GetterTree<VersionState, RootState>
