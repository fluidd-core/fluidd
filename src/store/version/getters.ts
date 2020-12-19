import { GetterTree } from 'vuex'
import { isOfType } from '@/store/helpers'
import { ArtifactVersion, HashVersion, VersionState } from './types'
import { RootState } from '../types'
import { valid, gt } from 'semver'

export const getters: GetterTree<VersionState, RootState> = {
  /**
   * Returns the list of available components
   */
  getComponents: (state) => {
    const components = { ...state.components }
    //   (obj, key) => {
    //     obj[key] = state.components[key]
    //     return obj
    //   }, {}
    // )
    // return ordered
    return components
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
    } else {
      const o = state.components[component] as HashVersion
      return (o.current_hash !== o.remote_hash)
    }
  }
}
