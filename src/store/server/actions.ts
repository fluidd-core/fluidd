import { ActionTree } from 'vuex'
import { ServerState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'

let retryTimeout: number

export const actions: ActionTree<ServerState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onServerInfo ({ commit, dispatch }, payload) {
    // This payload should return a list of enabled plugins
    // and root directories that are available.
    SocketActions.printerInfo()
    SocketActions.serverConfig()

    commit('setServerInfo', payload)
    if (
      payload.plugins &&
      payload.plugins.length > 0
    ) {
      const pluginsToInit: { [index: string]: { name: string; dispatch: string } } = Globals.MOONRAKER_PLUGINS
      for (const key in pluginsToInit) {
        const plugin = pluginsToInit[key]
        console.log('init pluigin', plugin.name)
        if (payload.plugins.includes(plugin.name)) {
          dispatch(plugin.dispatch, undefined, { root: true })
        }
      }
    }

    if (payload.klippy_state !== 'ready') {
      // If klippy is not connected, we'll continue to
      // retry the init process.
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
        SocketActions.serverInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    } else {
      // If klippy is connected, move on.
      SocketActions.printerObjectsList()
    }
  },

  /**
   * Gives us moonrakers configuration.
   */
  async onServerConfig ({ commit }, payload) {
    if (payload.config) {
      commit('setServerConfig', payload.config)
    }
  }
}
