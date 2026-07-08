import vuetify from '@/plugins/vuetify'
import type { ActionTree } from 'vuex'
import type { ConfigState, SaveByPath, InitConfig, InstanceConfig, TemperaturePreset, UiSettings, ThemeConfig, ConfiguredTableHeader } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { loadLocaleMessagesAsync, getStartingLocale } from '@/plugins/i18n'
import { Waits } from '@/globals'
import type { FileFilterType } from '../files/types'
import { TinyColor } from '@ctrl/tinycolor'
import dbKey from '@/util/db-key'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Init any file configs we may have.
   */
  async initUiSettings ({ commit, dispatch, state }, payload: Partial<UiSettings>) {
    commit('setInitUiSettings', payload)

    // Vuetify sometimes fails to apply the changes in a single operation but
    // doing it twice fixes it
    dispatch('onThemeChange', state.uiSettings.theme)
    dispatch('onThemeChange', state.uiSettings.theme)

    // Set the correct language.
    if (
      payload.general &&
      payload.general.locale
    ) {
      dispatch('onLocaleChange', payload.general.locale)
    }
  },

  async onThemeChange (_, payload: ThemeConfig) {
    const vuetifyTheme = vuetify.framework.theme

    vuetifyTheme.dark = payload.isDark
    vuetifyTheme.currentTheme.primary = payload.color
    vuetifyTheme.currentTheme['primary-offset'] = new TinyColor(payload.color)
      .desaturate(5)
      .darken(10)
      .toHexString()
    vuetifyTheme.themes.dark.logo = payload.logo.light
    vuetifyTheme.themes.light.logo = payload.logo.dark
  },

  /**
   * Sets, and saves a locale change.
   */
  async onLocaleChange ({ dispatch, state }, payload: string) {
    // Set the correct language.
    // vuetify.framework.lang.current = state.uiSettings.general.locale

    // Add the wait.
    dispatch('wait/addWait', Waits.onLoadLanguage, { root: true })

    // Grab the browsers starting locale.
    const startingLocale = getStartingLocale()

    // Set the locale. If its set as default, use the starting locale.
    const locale = (payload !== 'default')
      ? await loadLocaleMessagesAsync(payload)
      : await loadLocaleMessagesAsync(startingLocale)

    // If the locale doesn't match what we have in settings, update it.
    if (
      state.uiSettings.general.locale !== payload
    ) {
      dispatch('saveByPath', {
        path: 'uiSettings.general.locale',
        value: (payload !== 'default') ? locale : payload,
        server: true
      })
    }
    dispatch('wait/removeWait', Waits.onLoadLanguage, { root: true })
  },

  /**
   * Initializes our config based on the host and local storage, and sets our API config.
   */
  async initConfig ({ commit }, payload: InitConfig) {
    commit('setInitApiConfig', payload.apiConfig)
    commit('setInitHostConfig', payload.hostConfig)
    commit('setInitInstances', payload.apiConfig)
  },

  /**
   * Removes a known instance
   */
  async removeInstance ({ commit }, payload: InstanceConfig) {
    commit('setRemoveInstance', payload)
  },

  /**
   * Updates a known instance
   */
  async updateInstance ({ commit, dispatch, state, getters }, value: string) {
    // First, update the name in ui settings.
    dispatch('saveByPath', {
      path: 'uiSettings.general.instanceName',
      value,
      server: true
    })

    // Now, find the instance in our instance list and update there.
    let instance: InstanceConfig | undefined = getters.getCurrentInstance
    if (instance) {
      instance = {
        ...instance,
        name: state.uiSettings.general.instanceName
      }
      // update the instance item...
      commit('setUpdateInstanceName', instance)
    }
  },

  /**
   * Saves keys to config. Assumes a root[key] structure
   * under state.config.
   */
  async saveByPath ({ commit }, config: SaveByPath) {
    commit('setSaveByPath', config)
    if (config.server) {
      SocketActions.serverDatabasePostItem(config.path, config.value)
    }
  },

  /**
   * Add or update a given temp preset
   */
  async updatePreset ({ commit, state }, payload: TemperaturePreset) {
    commit('setPreset', payload)
    SocketActions.serverDatabasePostItem('uiSettings.dashboard.tempPresets', state.uiSettings.dashboard.tempPresets)
  },

  /**
   * Remove a temp preset
   */
  async removePreset ({ commit, state }, payload: TemperaturePreset) {
    commit('setRemovePreset', payload)
    SocketActions.serverDatabasePostItem('uiSettings.dashboard.tempPresets', state.uiSettings.dashboard.tempPresets)
  },

  /**
   * Set or update the color override for a temperature item
   */
  async updateSensorColor ({ commit }, payload: { key: string; color: string }) {
    commit('setSensorColor', payload)
    SocketActions.serverDatabasePostItem(dbKey`uiSettings.dashboard.sensorColors.${payload.key}`, payload.color)
  },

  /**
   * Remove the color override for a temperature item
   */
  async removeSensorColor ({ commit, state }, payload: { key: string }) {
    // Guard: delete_item errors on a key Moonraker never stored, so only fire the
    // network delete when an override actually existed. Own-property check (not
    // `key in`) so a Klipper section named like a prototype member (e.g.
    // `constructor`) can't spoof a delete on an empty map — mirrors removeAlias.
    const existed = Object.prototype.hasOwnProperty.call(state.uiSettings.dashboard.sensorColors, payload.key)
    commit('setRemoveSensorColor', payload)
    if (existed) {
      SocketActions.serverDatabaseDeleteItem(dbKey`uiSettings.dashboard.sensorColors.${payload.key}`)
    }
  },

  /**
   * Set or update the display-name alias for a fan, output pin, LED, heater or sensor.
   * Display-only: persists to the Moonraker DB `fluidd` namespace, never to Klipper config.
   */
  async updateAlias ({ commit, dispatch }, payload: { key: string; name: string }) {
    const name = payload.name.trim()

    // Never persist an empty alias. Delegate to removeAlias so the DB entry is
    // cleared via the guarded delete, keeping the getter fallback (`|| default`)
    // and the tooltip resolver in agreement.
    if (name === '') {
      await dispatch('removeAlias', { key: payload.key })
      return
    }

    commit('setAlias', { key: payload.key, name })
    SocketActions.serverDatabasePostItem(dbKey`uiSettings.dashboard.aliases.${payload.key}`, name)
  },

  /**
   * Remove the display-name alias for a fan, output pin, LED, heater or sensor.
   */
  async removeAlias ({ commit, state }, payload: { key: string }) {
    // Guard: delete_item errors on a key Moonraker never stored, so only fire the
    // network delete when an alias actually existed. Use an own-property check
    // (not `key in`) so a Klipper section named like a prototype member
    // (e.g. `constructor`, `toString`) can't spoof a delete on an empty map.
    const existed = Object.prototype.hasOwnProperty.call(state.uiSettings.dashboard.aliases, payload.key)
    commit('setRemoveAlias', payload)
    if (existed) {
      SocketActions.serverDatabaseDeleteItem(dbKey`uiSettings.dashboard.aliases.${payload.key}`)
    }
  },

  async updateFileSystemActiveFilters ({ commit, state }, payload: { root: string, value: FileFilterType[] }) {
    commit('setFileSystemActiveFilters', payload)
    SocketActions.serverDatabasePostItem(dbKey`uiSettings.fileSystem.activeFilters.${payload.root}`, state.uiSettings.fileSystem.activeFilters[payload.root])
  },

  async updateFileSystemSortBy ({ commit, state }, payload: { root: string, value: string | null }) {
    commit('setFileSystemSortBy', payload)
    SocketActions.serverDatabasePostItem(dbKey`uiSettings.fileSystem.sortBy.${payload.root}`, state.uiSettings.fileSystem.sortBy[payload.root])
  },

  async updateFileSystemSortDesc ({ commit, state }, payload: { root: string, value: boolean | null }) {
    commit('setFileSystemSortDesc', payload)
    SocketActions.serverDatabasePostItem(dbKey`uiSettings.fileSystem.sortDesc.${payload.root}`, state.uiSettings.fileSystem.sortDesc[payload.root])
  },

  /**
   * Toggle a tables header state based on its name and key.
   */
  async updateHeader ({ commit, state }, payload: { name: string; header: ConfiguredTableHeader }) {
    commit('setUpdateHeader', payload)

    if (state.uiSettings.tableHeaders[payload.name]) {
      SocketActions.serverDatabasePostItem(dbKey`uiSettings.tableHeaders.${payload.name}`, state.uiSettings.tableHeaders[payload.name])
    }
  },

  async updateHeaders ({ commit, state }, payload: { name: string; headers: ConfiguredTableHeader[] }) {
    commit('setUpdateHeaders', payload)

    if (state.uiSettings.tableHeaders[payload.name]) {
      SocketActions.serverDatabasePostItem(dbKey`uiSettings.tableHeaders.${payload.name}`, state.uiSettings.tableHeaders[payload.name])
    }
  },

  async updateThumbnailSizes ({ commit, state }, payload: { name: string; size: number }) {
    commit('setUpdateThumbnailSizes', payload)

    if (state.uiSettings.thumbnailSizes[payload.name]) {
      SocketActions.serverDatabasePostItem(dbKey`uiSettings.thumbnailSizes.${payload.name}`, state.uiSettings.thumbnailSizes[payload.name])
    }
  },

  async updateTheme ({ state, dispatch }, payload: Partial<ThemeConfig>) {
    const updatedTheme: ThemeConfig = {
      ...state.uiSettings.theme,
      ...payload
    }

    dispatch('onThemeChange', updatedTheme)

    dispatch('saveByPath', {
      path: 'uiSettings.theme',
      value: updatedTheme,
      server: true
    })
  }
} satisfies ActionTree<ConfigState, RootState>
