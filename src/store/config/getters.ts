import { GetterTree } from 'vuex'
import vuetify from '@/plugins/vuetify'
import { CardConfig, ConfigState, TemperaturePreset, ThemeConfig } from './types'
import { RootState } from '../types'
import { Heater, Fan } from '../printer/types'
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

  getHostConfig: (state) => {
    return state.hostConfig
  },

  /**
   * Return temp presets. Ensure we only return a preset
   * for a known heater or fan, incase things change
   * after a preset has been saved.
   */
  getTempPresets: (state, getters, rootState, rootGetters) => {
    const originalPresets: TemperaturePreset[] = state.uiSettings.dashboard.tempPresets
    const presets: TemperaturePreset[] = []
    const heaters = rootGetters['printer/getHeaters']
    const fans = rootGetters['printer/getOutputs'](['temperature_fan'])

    originalPresets.forEach((originalPreset: TemperaturePreset) => {
      const preset: TemperaturePreset = {
        ...originalPreset,
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

    return presets.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  },

  /**
   * Returns our current theme data.
   * Should augment vuetifies default.
   */
  getTheme: (state) => {
    const v = vuetify.framework.theme
    const o = state.uiSettings.theme

    const r: ThemeConfig = {
      ...state.uiSettings.theme,
      currentTheme: {
        ...v.currentTheme,
        ...o.currentTheme
      }
    }

    for (const key in r.currentTheme) {
      // Currently used for the offset in the logo.
      r.currentTheme[key + 'Offset'] = tinycolor(o.currentTheme.primary as string)
        .desaturate(5)
        .darken(10)
        .toHexString()
    }
    return r
  }
}
