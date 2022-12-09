import { GetterTree } from 'vuex'
import { isOfType } from '@/store/helpers'
import { ArtifactVersion, CommitItem, HashVersion, OSPackage, VersionState } from './types'
import { RootState } from '../types'
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
    let r = false
    for (const key in state.version_info) {
      if (!r) {
        if (
          key !== 'system' && // don't check system updates..
          enableNotifications
        ) {
          r = getters.hasUpdate(key)
        }
      } else {
        break
      }
    }
    return r
  },

  /**
   * Returns a boolean indicating if a given component has an update.
   */
  hasUpdate: (state) => (component: string): boolean => {
    if (state.version_info[component] && isOfType<ArtifactVersion>(state.version_info[component], 'name')) {
      const o = state.version_info[component] as ArtifactVersion
      const version = valid(o.version)
      const remoteVersion = valid(o.remote_version)
      if (version && remoteVersion) {
        return (gt(remoteVersion, version))
      }
      return false
    }

    if (state.version_info[component] && isOfType<OSPackage>(state.version_info[component], 'package_count')) {
      const o = state.version_info[component] as OSPackage
      return (o.package_count > 0)
    }

    const o = state.version_info[component] as HashVersion
    return (o.current_hash !== o.remote_hash)
  },

  getResponses: (state) => {
    return [...state.responses]
  },

  /**
   * Returns commit history grouped by day.
   */
  getCommitHistory: (state) => (component: string) => {
    // This is only relevant for certain types.
    if (state.version_info[component] && isOfType<HashVersion>(state.version_info[component], 'git_messages')) {
      const c = state.version_info[component] as HashVersion
      const result = [...c.commits_behind]
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
