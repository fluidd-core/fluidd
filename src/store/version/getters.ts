import { GetterTree } from 'vuex'
import { isOfType } from '@/store/helpers'
import { ArtifactVersion, HashVersion, OSPackage, VersionState } from './types'
import { RootState } from '../types'
import { valid, gt } from 'semver'

export const getters: GetterTree<VersionState, RootState> = {
  /**
   * Returns the list of available components
   */
  getVisibleComponents: (state) => {
    const c: Array<HashVersion | ArtifactVersion | OSPackage> = []
    const skipClient = state.skipClientUpdates
    for (const key in state.components) {
      const o = state.components[key]
      if (key === 'client' && skipClient) continue
      // if (key === 'system') continue
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
   * Returns an object indicating if any component has an update.
   */
  hasUpdates: (state, getters) => {
    let r = false
    for (const k in state.components) {
      if (!r) {
        r = getters.hasUpdate(k)
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
  }
}
