import Vue from 'vue'
import type { ActionTree } from 'vuex'
import type { CanbusUuid, Peripherals, ServerInfo, ServerState, ServerThrottledState, ServiceState, SystemInfo } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import type { AppPushNotification } from '../notifications/types'
import { EventBus } from '@/eventBus'
import i18n from '@/plugins/i18n'
import { gte, valid } from 'semver'

let retryTimeout: number

export const actions: ActionTree<ServerState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async resetKlippy ({ commit }) {
    commit('setResetKlippy')
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

  async checkMoonrakerMinVersion ({ state, dispatch }) {
    const moonrakerVersion = state.info.moonraker_version ?? '?'

    const fullMoonrakerVersion = moonrakerVersion.includes('-')
      ? moonrakerVersion
      : `${moonrakerVersion}-0`

    if (
      valid(fullMoonrakerVersion) &&
      valid(Globals.MOONRAKER_MIN_VERSION) &&
      !gte(fullMoonrakerVersion, Globals.MOONRAKER_MIN_VERSION)
    ) {
      dispatch('notifications/pushNotification', {
        id: `old-moonraker-${moonrakerVersion}`,
        title: 'Moonraker',
        description: i18n.t('app.version.label.old_component_version', { name: 'Moonraker', version: Globals.MOONRAKER_MIN_VERSION }),
        to: '/settings#versions',
        btnText: i18n.t('app.version.btn.view_versions'),
        type: 'warning',
        merge: true
      }, { root: true })
    }
  },

  /**
   * On server info
   */
  async onServerInfo ({ commit, dispatch, state }, payload: ServerInfo) {
    // This payload should return a list of enabled components
    // and root directories that are available.
    SocketActions.printerInfo()
    SocketActions.serverConfig()
    SocketActions.machineProcStats()
    SocketActions.machineSystemInfo()

    const klippyConnectedNow = (
      payload.klippy_connected &&
      !state.info.klippy_connected
    )

    commit('setServerInfo', payload)

    dispatch('checkMoonrakerMinVersion')

    if (payload.klippy_state !== 'ready') {
      // If klippy is not connected, we'll continue to
      // retry the init process.
      if (state.klippy_retries === 0) {
        dispatch('initComponents', payload)
      }
      if (klippyConnectedNow) {
        SocketActions.printerObjectsList()
      }
      commit('setKlippyRetries', state.klippy_retries + 1)
      clearTimeout(retryTimeout)
      retryTimeout = window.setTimeout(() => {
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

  async onLogsRollOver (_, payload?: { rolled_over?: string[], failed?: Record<string, string> }) {
    if (payload?.failed && Object.keys(payload.failed).length > 0) {
      const message = Object.values(payload.failed)
        .join('\n')

      EventBus.$emit(message, { type: 'error' })
    } else if (payload?.rolled_over && payload.rolled_over.length) {
      const applications = payload.rolled_over
        .map(Vue.$filters.prettyCase)
        .join(', ')
      const message = i18n.tc('app.general.msg.rolledover_logs', 0, { applications })

      EventBus.$emit(message, { type: 'success' })
    }
  },

  async onMachineProcStats ({ commit, dispatch }, payload) {
    if (payload && payload.throttled_state) {
      await dispatch('onMachineThrottledState', payload.throttled_state)
    }
    commit('setMoonrakerStats', payload)

    // Add a chart entry
    if (
      payload.moonraker_stats &&
      'cpu_usage' in payload.moonraker_stats &&
      !Array.isArray(payload.moonraker_stats)
    ) {
      const d = payload.moonraker_stats
      if (d.cpu_usage <= 100) {
        commit('charts/setChartEntry', {
          type: 'moonraker',
          retention: 600,
          data: {
            date: new Date(d.time * 1000),
            load: d.cpu_usage.toFixed(2)
          }
        }, { root: true })
      }
    }
  },

  async onMachineSystemInfo ({ commit }, payload: { system_info?: SystemInfo }) {
    commit('setSystemInfo', payload)
  },

  async onMachinePeripherals ({ commit }, payload: Partial<Peripherals>) {
    commit('setMachinePeripherals', payload)
  },

  async onMachinePeripheralsCanbus ({ commit }, payload: { can_uuids: CanbusUuid[], __request__: any }) {
    const { interface: canbusInterface } = payload.__request__.params

    commit('setMachinePeripheralsCanbus', { canbusInterface, can_uuids: payload.can_uuids })
  },

  async onServiceStateChanged ({ commit }, payload: ServiceState) {
    commit('setServiceState', payload)
  },

  async onMachineThrottledState ({ commit, dispatch, state }, payload: ServerThrottledState) {
    if (payload) {
      // If we have a throttled condition.
      if (payload && payload.flags.length > 0) {
        // Fire notifications.
        payload.flags.forEach((flag) => {
          // Only apply a notification if the flag changed state.
          if (state.throttled_state && !state.throttled_state.flags.includes(flag)) {
            const previousEvent = flag.toLowerCase().startsWith('previously')
            let n: AppPushNotification = {
              id: flag,
              title: flag,
              description: 'This may lead to a throttle condition and result in a failed print',
              to: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#frequency-management-and-thermal-control',
              type: (previousEvent) ? 'info' : 'error',
              snackbar: !previousEvent, // Snackbar only if not a previously encountered event.
              merge: true, // Merge if it was a previously encountered event.
              clear: !previousEvent, // Dont allow the user to clear if it was a previously encountered event.
              noCount: previousEvent // Dont add to the counter if it was a previously encountered event.
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
