import type { GetterTree } from 'vuex'
import type { ConfigState, CustomNavLink, TemperaturePreset } from './types'
import type { RootState } from '../types'
import type { Heater, Fan } from '../printer/types'
import type { AppDataTableHeader } from '@/types'
import md5 from 'md5'

export const getters = {
  getCurrentInstance: (state) => {
    return state.instances
      .find(instance => instance.active)
  },

  getInstances: (state) => {
    const instances = [...state.instances]

    return instances
      .sort((a, b) => +b.active - +a.active || a.name.localeCompare(b.name))
  },

  /**
   * Return temp presets. Ensure we only return a preset
   * for a known heater or fan, incase things change
   * after a preset has been saved.
   */
  getTempPresets: (state, getters, rootState, rootGetters) => {
    const originalPresets: TemperaturePreset[] = state.uiSettings.dashboard.tempPresets
    const presets: TemperaturePreset[] = []
    const heaters: Heater[] = rootGetters['printer/getHeaters']
    const fans: Fan[] = rootGetters['printer/getOutputs'](['temperature_fan'])

    originalPresets.forEach((originalPreset: TemperaturePreset) => {
      const preset: TemperaturePreset = {
        ...originalPreset,
        values: {}
      }
      // Loop through the preset and ensure that;
      // a) a given heater and fan exists and;
      // b) unknown heaters and fans are removed.
      // For items added to an existing preset, default them to disabled.
      heaters.forEach(heater => {
        if (originalPreset.values[heater.name]) {
          preset.values[heater.name] = { ...originalPreset.values[heater.name] }
        } else {
          preset.values[heater.name] = { value: 0, type: 'heater', active: false }
        }
      })
      fans.forEach(fan => {
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
    const files: Moonraker.Files.RootFile[] | undefined = rootGetters['files/getRootFiles']('config')

    if (files) {
      for (const extension of extensions) {
        const path = `.fluidd-theme/${filename}${extension}`

        if (files.some(f => f.path === path)) {
          return path
        }
      }
    }
  },

  getMergedTableHeaders: (state) => (headers: AppDataTableHeader[], key: string): AppDataTableHeader[] => {
    const configuredHeaders = state.uiSettings.tableHeaders[key]

    if (!configuredHeaders) {
      return headers
    }

    // if the number of configured headers is the same as the available headers,
    // then use configured headers to keep order
    // else go with available headers
    return headers.length === configuredHeaders.length
      ? configuredHeaders
        .map((configuredHeader): AppDataTableHeader | null => {
          const header = headers.find(p => p.value === configuredHeader.value)

          if (!header) {
            return null
          }

          return {
            ...header,
            ...configuredHeader,
          }
        })
        .filter(header => header != null)
      : headers
        .map((header): AppDataTableHeader => ({
          ...header,
          ...configuredHeaders.find(p => p.value === header.value)
        }))
  },

  getThemeNavLinks: (state): CustomNavLink[] => {
    const activePreset = state.hostConfig.themePresets.find(
      p => p.logo.src === state.uiSettings.theme.logo.src
    )
    if (!activePreset) return []

    // Resolve links array: prefer preset.links, fall back to legacy preset.url
    const links = activePreset.links
      ?? (activePreset.url ? [{ title: activePreset.name, url: activePreset.url }] : [])

    if (links.length === 0) return []

    const baseId = `preset-${activePreset.logo.src}`

    return links.map((link, index) => {
      // Resolve icon per link via fallback chain
      const customIcon: string | undefined | any[] = link.icon      // per-link SVG filename
        ?? activePreset.logo.icon                                   // preset-level SVG filename
        ?? activePreset.icon                                        // legacy SvgIconPath[]
        ?? activePreset.logo.src                                    // ultimate fallback

      // Generate stable IDs: first link keeps legacy ID for backwards compat
      const id = index === 0 ? baseId : `${baseId}-${index}`

      // Position: use stored position if available, otherwise group at top
      const storedPosition = state.uiSettings.navigation?.themeLinkPositions?.[id]
      const position = storedPosition ?? (-1 + index)

      return {
        id,
        title: link.title,
        url: link.url,
        icon: 'openInNew',
        customIcon,
        position
      }
    })
  },

  getDbNavLinks: (state): CustomNavLink[] => {
    return [...(state.uiSettings.navigation?.customLinks || [])]
      .sort((a, b) => a.position - b.position)
  },

  getCustomNavLinks: (state, getters): CustomNavLink[] => {
    const dbLinks = state.uiSettings.navigation?.customLinks || []
    const hidden = state.uiSettings.navigation?.hiddenThemeLinks || []
    const themeLinks = (getters.getThemeNavLinks as CustomNavLink[])
      .filter(l => !hidden.includes(l.id))
    const combined = [...dbLinks, ...themeLinks]
    return combined.sort((a, b) => a.position - b.position)
  },

  getTokenKeys: (state) => {
    const url = state.apiUrl
    const hash = (url) ? md5(url) : ''
    return {
      'user-token': `user-token-${hash}`,
      'refresh-token': `refresh-token-${hash}`
    }
  }
} satisfies GetterTree<ConfigState, RootState>
