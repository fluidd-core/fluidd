import vuetify from '@/plugins/vuetify'
import type { ActionTree } from 'vuex'
import type { ConfigState, SaveByPath, InitConfig, InstanceConfig, UiSettings, ThemeConfig } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { loadLocaleMessagesAsync, getStartingLocale } from '@/plugins/i18n'
import { Waits } from '@/globals'
import type { AppTableHeader } from '@/types'
import type { FileFilterType } from '../files/types'
import { TinyColor } from '@ctrl/tinycolor'

export const actions: ActionTree<ConfigState, RootState> = {
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
   * Inits the host configuration.
   */
  async initHost ({ commit }, payload: InitConfig) {
    commit('setInitHostConfig', payload.hostConfig)
  },

  /**
   * Inits any local storage state we may have.
   */
  async initLocal ({ commit }, payload: InitConfig) {
    commit('setInitInstances', payload) // Loads instances from local storage, and also inits the current instance.
  },

  /**
   * Ensure our instance is recorded, and set the current instance.
   */
  async onInitApiConfig ({ commit }, payload) {
    commit('setInitApiConfig', payload)
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
  async updateInstance ({ commit, dispatch, state, getters }, value: InstanceConfig) {
    // First, update the name in ui settings.
    dispatch('saveByPath', {
      path: 'uiSettings.general.instanceName',
      value,
      server: true
    })

    // Now, find the instance in our instance list and update there.
    let instance = getters.getCurrentInstance
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
      SocketActions.serverWrite(config.path, config.value)
    }
  },

  /**
   * Add or update a given temp preset
   */
  async updatePreset ({ commit, state }, payload) {
    commit('setPreset', payload)
    SocketActions.serverWrite('uiSettings.dashboard.tempPresets', state.uiSettings.dashboard.tempPresets)
  },

  /**
   * Remove a temp preset
   */
  async removePreset ({ commit, state }, payload) {
    commit('setRemovePreset', payload)
    SocketActions.serverWrite('uiSettings.dashboard.tempPresets', state.uiSettings.dashboard.tempPresets)
  },

  async updateFileSystemActiveFilters ({ commit, state }, payload: { root: string, value: FileFilterType[] }) {
    commit('setFileSystemActiveFilters', payload)
    SocketActions.serverWrite(`uiSettings.fileSystem.activeFilters.${payload.root}`, state.uiSettings.fileSystem.activeFilters[payload.root])
  },

  async updateFileSystemSortBy ({ commit, state }, payload: { root: string, value: string | null }) {
    commit('setFileSystemSortBy', payload)
    SocketActions.serverWrite(`uiSettings.fileSystem.sortBy.${payload.root}`, state.uiSettings.fileSystem.sortBy[payload.root])
  },

  async updateFileSystemSortDesc ({ commit, state }, payload: { root: string, value: boolean | null }) {
    commit('setFileSystemSortDesc', payload)
    SocketActions.serverWrite(`uiSettings.fileSystem.sortDesc.${payload.root}`, state.uiSettings.fileSystem.sortDesc[payload.root])
  },

  /**
   * Toggle a tables header state based on its name and key.
   */
  async updateHeader ({ commit, state }, payload: { name: string; header: AppTableHeader }) {
    commit('setUpdateHeader', payload)
    if (state.uiSettings.tableHeaders[payload.name]) {
      SocketActions.serverWrite(`uiSettings.tableHeaders.${payload.name}`, state.uiSettings.tableHeaders[payload.name])
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
}
