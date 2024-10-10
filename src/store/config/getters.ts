import type { GetterTree } from 'vuex'
import type { ConfigState, TemperaturePreset } from './types'
import type { RootState } from '../types'
import type { Heater, Fan } from '../printer/types'
import type { AppTableHeader } from '@/types'
import type { AppTablePartialHeader } from '@/types/tableheaders'
import type { MoonrakerRootFile } from '../files/types'
import md5 from 'md5'

export const getters: GetterTree<ConfigState, RootState> = {
  getCurrentInstance: (state) => {
    return state.instances.find(instance => instance.active)
  },

  getInstances: (state) => {
    const instances = [
      ...state.instances
    ].sort((a, b) =>
      a.active
        ? -1
        : (b.active ? 1 : a.name.localeCompare(b.name))
    )
    return instances
  },

  getHostConfig: (state) => {
    return state.hostConfig
  },

  getAppReady: (state) => {
    return state.appReady
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

  getCustomThemeFile: (state, getters, rootState, rootGetters) => (filename: string, extensions: string[]) => {
    const files = rootGetters['files/getRootFiles']('config') as MoonrakerRootFile[] | undefined

    if (files) {
      for (const extension of extensions) {
        const path = `.fluidd-theme/${filename}${extension}`

        if (files.some(f => f.path === path)) {
          return path
        }
      }
    }
  },

  getMergedTableHeaders: (state, getters) => (headers: AppTableHeader[], key: string) => {
    const configured: AppTablePartialHeader[] = getters.getConfiguredTableHeaders(key)
    if (!configured) {
      return headers
    }
    const merged: AppTableHeader[] = []
    headers.forEach(header => {
      const keyBy = (header.key)
        ? 'key'
        : 'value'

      const o = {
        visible: true,
        configurable: false,
        ...header,
        ...configured.find(p => p[keyBy] === header[keyBy])
      }

      merged.push(o)
    })
    return merged
  },

  getConfiguredTableHeaders: (state) => (key: string) => {
    return state.uiSettings.tableHeaders[key]
  },

  getTokenKeys: (state) => {
    const url = state.apiUrl
    const hash = (url) ? md5(url) : ''
    return {
      'user-token': `user-token-${hash}`,
      'refresh-token': `refresh-token-${hash}`
    }
  }
}
