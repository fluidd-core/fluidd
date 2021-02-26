import { GetterTree } from 'vuex'
import { CardConfig, ConfigState, TemperaturePreset } from './types'
import { RootState } from '../types'
import { Heater, Fan } from '../socket/types'
import tinycolor from '@ctrl/tinycolor'

export const getters: GetterTree<ConfigState, RootState> = {
  getCurrentInstance: (state) => {
    return state.instances.find(instance => instance.active)
  },

  getInstances: (state) => {
    const instances = [...state.instances]
    instances.sort((a, b) => {
      return (a.active) ? -1 : (b.active) ? 1 : 0
    })
    return instances
  },

  getCards: (state) => (group: string): CardConfig[] => {
    return state.cardLayout[group]
  },

  /**
   * Return temp presets. Ensure we only return a preset
   * for a known heater or fan, incase things change
   * after a preset has been saved.
   */
  getTempPresets: (state, getters, rootState, rootGetters) => {
    const originalPresets: TemperaturePreset[] = state.uiSettings.dashboard.tempPresets
    const presets: TemperaturePreset[] = []
    const heaters = rootGetters['socket/getHeaters']
    const fans = rootGetters['socket/getOutputs'](['temperature_fan'])

    originalPresets.forEach((originalPreset: TemperaturePreset) => {
      const preset: TemperaturePreset = {
        name: originalPreset.name,
        values: {}
      }
      // Loop through the preset and ensure that;
      // a) a given heater and fan exists and;
      // b) unknown heaters and fans are removed.
      // For items added to an existing preset, default them to disabled.
      heaters.forEach((heater: Heater) => {
        if (originalPreset.values[heater.name]) {
          preset.values[heater.name] = { ...originalPreset.values[heater.name] }
        } else {
          preset.values[heater.name] = { value: 0, type: 'heater', active: false }
        }
      })
      fans.forEach((fan: Fan) => {
        if (originalPreset.values[fan.name]) {
          preset.values[fan.name] = { ...originalPreset.values[fan.name] }
        } else {
          preset.values[fan.name] = { value: 0, type: 'fan', active: false }
        }
      })

      presets.push(preset)
    })

    return presets
  },

  /**
   * Returns our current theme data.
   */
  getTheme: (state) => {
    const o = state.uiSettings.theme
    return {
      ...o,
      colors: {
        ...o.colors,
        primaryOffset: tinycolor(o.colors.primary)
          .desaturate(5)
          .darken(10)
          .toHexString()
      }
    }
  }
}
