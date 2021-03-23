import vuetify from '@/plugins/vuetify'
import { ActionTree } from 'vuex'
import { ConfigState, SaveByPath, InitConfig, InstanceConfig, UiSettings, HostConfig, CardConfig, CardState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
import { loadLocaleMessagesAsync } from '@/plugins/i18n'

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
  async initUiSettings ({ commit, state }, payload: UiSettings) {
    commit('setInitUiSettings', payload)

    // Set vuetify to the correct initial theme.
    if (state.uiSettings.theme) {
      vuetify.framework.theme.dark = state.uiSettings.theme.isDark
      vuetify.framework.theme.currentTheme.primary = state.uiSettings.theme.currentTheme.primary
    }

    // Set the correct language.
    if (state.uiSettings.general.locale !== 'en') {
      // vuetify.framework.lang.current = state.uiSettings.general.locale
      loadLocaleMessagesAsync(state.uiSettings.general.locale)
    }
  },

  /**
   * Inits the host configuration.
   */
  async initHost ({ commit }, payload: HostConfig) {
    commit('setInitHostConfig', payload)
  },

  /**
   * Inits any local storage state we may have.
   */
  async initLocal ({ commit }, payload: InitConfig) {
    commit('setInitLocal') // Just loads local storage config into the store.
    commit('setInitInstances', payload) // Loads instances from local storage, and also inits the current instance.
  },

  /**
   * Ensure our instance is recorded, and set the current instance.
   */
  async onInitApiConfig ({ commit }, payload) {
    commit('setInitApiConfig', payload)
  },

  /**
   * Saves the card configuration, i.e., their position.
   */
  async saveCardConfig ({ commit }, payload: { group: string; cards: CardConfig[] }) {
    commit('setCardConfig', payload)
  },

  /**
   * Saves the card state, i.e., if collapsed or not.
   */
  async saveCardState ({ commit }, payload: CardState) {
    commit('setCardState', payload)
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
      instance = { ...instance, ...{ name: state.uiSettings.general.instanceName } }
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
  }
}
