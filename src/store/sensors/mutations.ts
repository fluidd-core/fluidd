import type { MutationTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setInitSensors (state, payload: Partial<MoonrakerSensorsState>) {
    if (payload) {
      Object.assign(state, payload)
    }
  },

  setExpanded (state, expanded: string[]) {
    state.expanded = expanded
  },

  setSensorsList (state, payload: Moonraker.Sensor.ListResponse) {
    state.sensors = Object.fromEntries(
      Object.entries(payload.sensors)
        .map(([key, entry]) => [
          key,
          {
            ...entry,
            values: Object.freeze(entry.values)
          }
        ])
    )
  },

  setSensorUpdate (state, payload: Record<string, Moonraker.Sensor.Values>) {
    for (const sensorKey in payload) {
      state.sensors[sensorKey].values = Object.freeze(payload[sensorKey])
    }
  }
} satisfies MutationTree<MoonrakerSensorsState>
