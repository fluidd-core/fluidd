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

  async onServerInfo ({ commit }, payload) {
    // This payload should return a list of enabled plugins
    // and root directories that are available.
    SocketActions.printerInfo()
    SocketActions.serverConfig()

    commit('setServerInfo', payload)
    if (
      payload.plugins &&
      payload.plugins.length > 0
    ) {
      // Init defined plugins.
      const pluginsToInit = [
        'power',
        'update_manager'
      ]
      pluginsToInit.forEach((plugin) => {
        if (payload.plugins.includes(plugin)) {
          switch (plugin) {
            case 'power':
              SocketActions.machineDevicePowerDevices()
              break
            case 'update_manager':
              SocketActions.machineUpdateStatus()
              break
          }
        }
      })
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
