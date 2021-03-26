import { GetterTree } from 'vuex'
import { ServerInfo, ServerConfig, ServerState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<ServerState, RootState> = {
  /**
   * Get's the current server info
   */
  getInfo: (state): ServerInfo => {
    return state.info
  },

  /**
   * Return server config
   */
  getConfig: (state): ServerConfig => {
    return state.config
  },

  /**
   * Indicates if a plugin is enabled
   */
  pluginSupport: (state) => (plugin: string) => {
    return (state.info.plugins.includes(plugin))
  }
}
