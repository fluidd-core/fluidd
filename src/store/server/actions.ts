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

  /**
   * Init moonraker components.
   * During app init, we want to initially init these once, irrelevant
   * of klippy's state. After that, we'd only ever init once more if
   * klippy is connected.
   */
  async initComponents ({ dispatch }, payload) {
    if (
      payload.components &&
      payload.components.length > 0
    ) {
      const componentsToInit: { [index: string]: { name: string; dispatch: string } } = Globals.MOONRAKER_COMPONENTS
      for (const key in componentsToInit) {
        const component = componentsToInit[key]
        if (payload.components.includes(component.name)) {
          dispatch(component.dispatch, undefined, { root: true })
        }
      }
    }
  },

  /**
   * On server info
   */
  async onServerInfo ({ commit, dispatch, state }, payload) {
    // This payload should return a list of enabled components
    // and root directories that are available.
    SocketActions.printerInfo()
    SocketActions.serverConfig()

    commit('setServerInfo', payload)

    if (payload.klippy_state !== 'ready') {
      // If klippy is not connected, we'll continue to
      // retry the init process.
      if (state.klippy_retries === 0) dispatch('initComponents', payload)
      commit('setKlippyRetries', state.klippy_retries + 1)
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
        SocketActions.serverInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    } else {
      // If klippy is connected, move on.
      commit('setKlippyRetries', 0)
      dispatch('initComponents', payload)
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
