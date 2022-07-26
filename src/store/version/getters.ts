import { GetterTree } from 'vuex'
import { isOfType } from '@/store/helpers'
import { ArtifactVersion, HashVersion, OSPackage, VersionState } from './types'
import { RootState } from '../types'
import { valid, gt } from 'semver'
import _Vue from 'vue'

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

    o.sort((a, b) => {
      const name1 = a.key.toLowerCase()
      const name2 = b.key.toLowerCase()
      return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
    })
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
        .reduce((result: any, a) => {
          const d = _Vue.$dayjs(+a.date * 1000).hour(6).minute(0).second(0).unix() * 1000
          result[d] = result[d] || []
          result[d].push({
            ...a,
            date: +a.date * 1000
          })
          return result
        }, Object.create(null))
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
