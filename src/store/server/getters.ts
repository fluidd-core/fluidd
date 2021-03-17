import { GetterTree } from 'vuex'
import { ServerInfo, ServerState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<ServerState, RootState> = {
  /**
   * Get's the current server info
   */
  getInfo: (state): ServerInfo => {
    return state.info
  },

  /**
   * Indicates if a plugin is enabled
   */
  pluginSupport: (state) => (plugin: string) => {
    return (state.info.plugins.includes(plugin))
  }
}
