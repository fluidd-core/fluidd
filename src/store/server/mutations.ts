import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { Peripherals, ServerState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  setResetKlippy (state) {
    const { info } = createState()

    state.info.klippy_connected = info.klippy_connected
    state.info.klippy_state = info.klippy_state
  },

  setServerInfo (state, payload: Moonraker.Server.InfoResponse) {
    state.info = payload
  },

  setSystemInfo (state, payload: Moonraker.Machine.SystemInfoResponse) {
    if (payload.system_info) {
      state.system_info = payload.system_info
    }
  },

  setMachinePeripherals (state, payload: Partial<Peripherals>) {
    state.peripherals = {
      ...state.peripherals,
      ...payload
    }
  },

  setMachinePeripheralsCanbus (state, payload: { canbusInterface: string, can_uuids: Moonraker.Peripherals.CanbusUuid[] }) {
    state.can_uuids = {
      ...state.can_uuids,
      [payload.canbusInterface]: payload.can_uuids
    }
  },

  setServiceState (state, payload: Moonraker.Machine.ServiceState) {
    if (payload && state.system_info?.service_state) {
      Object.assign(state.system_info.service_state, payload)
    }
  },

  setAgentsLoaded (state, payload: boolean) {
    state.agentsLoaded = payload
  },

  setAgents (state, payload: string[]) {
    state.agents = [...payload]
  },

  setAgentConnected (state, payload: { name: string, connected: boolean }) {
    const others = state.agents.filter(name => name !== payload.name)

    state.agents = payload.connected
      ? [...others, payload.name]
      : others
  },

  /**
   * On initial init we get the server (moonraker) configuration.
   */
  setServerConfig (state, payload: Moonraker.Server.Config) {
    state.config = {
      ...state.config,
      ...payload
    }
  },

  /**
   * On initial init, we get the server (moonraker) process stats and any throttled state flags.
   */
  setMoonrakerStats (state, payload: Moonraker.ProcStats.Response | Moonraker.ProcStats.UpdateEvent) {
    if (payload.cpu_temp != null) {
      state.cpu_temp = payload.cpu_temp
    }

    if ('throttled_state' in payload && payload.throttled_state != null) {
      state.throttled_state = {
        ...state.throttled_state,
        ...payload.throttled_state
      }
    }

    if (Array.isArray(payload.moonraker_stats)) {
      // Update with array.
      state.moonraker_stats = payload.moonraker_stats
        .map(stat => Object.freeze(stat))
    } else {
      // Append to array.
      state.moonraker_stats.push(Object.freeze(payload.moonraker_stats))
      while (state.moonraker_stats.length > 30) {
        state.moonraker_stats.splice(0, 1)
      }
    }
  }
} satisfies MutationTree<ServerState>
