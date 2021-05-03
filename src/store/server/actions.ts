import { ActionTree } from 'vuex'
import { ServerState, ServerThrottledState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'
import { AppPushNotification } from '../notifications/types'

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
    SocketActions.machineProcStats()

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
   * Gives us moonrakers configuration./
   */
  async onServerConfig ({ commit }, payload) {
    if (payload.config) {
      commit('setServerConfig', payload.config)
    }
  },

  async onMachineProcStats ({ commit, dispatch }, payload) {
    if (payload && payload.throttled_state) {
      await dispatch('onMachineThrottledState', payload.throttled_state)
    // } else {
    }
    commit('setMoonrakerStats', payload)
  },

  async onMachineThrottledState ({ commit, dispatch, state }, payload: ServerThrottledState) {
    if (payload) {
      // If we have a throttled condition.
      if (payload && payload.flags.length > 0) {
        // Fire notifications.
        payload.flags.forEach((flag) => {
          // Only apply a notification if the flag changed state.
          if (!state.throttled_state?.flags.includes(flag)) {
            const previousEvent = flag.toLowerCase().startsWith('previously')
            let n: AppPushNotification = {
              title: flag,
              description: 'This may lead to a throttle condition and result in a failed print',
              to: 'https://www.raspberrypi.org/documentation/hardware/raspberrypi/frequency-management.md',
              type: 'error',
              snackbar: !previousEvent, // Snackbar only if not a previously encountered event.
              merge: previousEvent, // Merge if it was a previously encountered event.
              clear: !previousEvent // Dont allow the user to clear if it was a previously encountered event.
            }

            // Add the temperature icon.
            if (
              (flag === 'Temperature Limit Active' || flag === 'Frequency Capped') &&
              state.cpu_temp
            ) {
              n = {
                ...n,
                suffix: `${state.cpu_temp.toFixed(0)}<small>°C</small>`,
                suffixIcon: '$tempError'
              }
            }

            // Not a previous event, adjust the description.
            if (!previousEvent) {
              n = {
                ...n,
                description: 'This may lead to a failed print'
              }
            }

            dispatch('notifications/pushNotification', n, { root: true })
          }
        })
      }

      commit('setMoonrakerStats', { throttled_state: payload })
    }
  }
}
