import { GetterTree } from 'vuex'
import { isOfType } from '@/store/helpers'
import { ArtifactVersion, HashVersion, OSPackage, VersionState } from './types'
import { RootState } from '../types'
import { valid, gt } from 'semver'
import _Vue from 'vue'

export const getters: GetterTree<VersionState, RootState> = {
  /**
   * Returns the list of available components
   */
  getVisibleComponents: (state) => {
    const c: Array<HashVersion | ArtifactVersion | OSPackage> = []
    for (const key in state.components) {
      const o = state.components[key]
      c.push(o)
    }

    c.sort((a, b) => {
      const name1 = a.type.toLowerCase()
      const name2 = b.type.toLowerCase()
      return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
    })
    return c
  },

  /**
   * Returns an object indicating if any component (but system) has an update.
   */
  hasUpdates: (state, getters) => {
    let r = false
    for (const key in state.components) {
      if (
        !r ||
        key !== 'system'
      ) {
        r = getters.hasUpdate(key)
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
    if (state.components[component] && isOfType<ArtifactVersion>(state.components[component], 'name')) {
      const o = state.components[component] as ArtifactVersion
      const version = valid(o.version)
      const remoteVersion = valid(o.remote_version)
      if (version && remoteVersion) {
        return (gt(remoteVersion, version))
      }
      return false
    }

    if (state.components[component] && isOfType<OSPackage>(state.components[component], 'package_count')) {
      const o = state.components[component] as OSPackage
      return (o.package_count > 0)
    }

    const o = state.components[component] as HashVersion
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
    if (state.components[component] && isOfType<HashVersion>(state.components[component], 'git_messages')) {
      const c = state.components[component] as HashVersion
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
      // console.log(result)
    }
  }
}
