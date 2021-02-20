import Vue from 'vue'
import { ActionTree } from 'vuex'
import { ConfigState, GenericSave, Config, InstanceConfig, UiSettings, HostConfig, CardConfig, CardState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'
import { get } from 'lodash-es'

export const actions: ActionTree<ConfigState, RootState> = {
  /**
   * Init any file configs we may have.
   */
  async initUiSettings ({ commit }, payload: UiSettings) {
    commit('initUiSettings', payload)
  },
  async initConsoleHistory ({ commit }, payload: string[]) {
    commit('initConsoleHistory', payload)
  },
  async initPrintHistory ({ commit }, payload: string[]) {
    commit('initPrintHistory', payload)
  },

  /**
   * Inits the host configuration.
   */
  async initHost ({ commit }, payload: HostConfig) {
    commit('onInitHostConfig', payload)
    commit('version/setSkipClientUpdates', payload, { root: true }) // this should move to the config module if we ever add to it.
  },

  /**
   * Inits any local storage state we may have.
   */
  async initLocal ({ commit }, payload: Config) {
    commit('onInitLocal') // Just loads local storage config into the store.
    commit('onInitInstances', payload) // Loads instances from local storage, and also inits the current instance.
  },

  /**
   * Ensure our instance is recorded, and set the current instance.
   */
  onInitApiConfig ({ commit }, payload) {
    commit('onInitApiConfig', payload)
  },

  async saveCardConfig ({ commit }, payload: { group: string; cards: CardConfig[] }) {
    commit('saveCardConfig', payload)
  },

  async saveCardState ({ commit }, payload: CardState) {
    commit('saveCardState', payload)
  },

  async removeInstance ({ commit }, payload: InstanceConfig) {
    commit('removeInstance', payload)
  },

  async updateInstance ({ commit }, payload: InstanceConfig) {
    commit('updateInstanceName', payload)
  },

  /**
   * Saves keys to config. Assumes a root[key] structure
   * under state.config.
   *
   * If the key starts with uiSettings, we'll automatically
   * save to file too.
   *
   * NOTE: These won't be reactive unless the state was predefined.
   */
  async saveGeneric ({ commit, dispatch }, config: GenericSave) {
    commit('onSaveGeneric', config)
    if (config.key.startsWith('uiSettings')) {
      dispatch('saveUiSettings')
    }
    if (config.key.startsWith('consoleHistory')) {
      dispatch('saveFile', { objectPath: 'consoleHistory', file: Globals.CONFIG_FILES.ConsoleHistory })
    }
  },

  /**
   *
   */
  async updateHiddenMacros ({ commit, dispatch }, payload) {
    commit('updateHiddenMacros', payload)
    dispatch('saveUiSettings')
  },

  /**
   * Add or update a given preset
   */
  async updatePreset ({ commit, dispatch }, payload) {
    commit('setUnsavedChanges', true)
    commit('updatePreset', payload)
    dispatch('saveUiSettings')
  },

  async removePreset ({ commit, dispatch }, payload) {
    commit('setUnsavedChanges', true)
    commit('removePreset', payload)
    dispatch('saveUiSettings')
  },

  async saveUiSettings ({ commit, dispatch, state, rootGetters }) {
    let instance = rootGetters['config/getCurrentInstance']
    if (instance) {
      instance = { ...instance, ...{ name: state.uiSettings.general.instanceName } }
      dispatch('updateInstance', instance)
    }

    if (state.uiSettings && Object.keys(state.uiSettings).length > 0) {
      dispatch('saveFile', { objectPath: 'uiSettings', file: Globals.CONFIG_FILES.UiSettings })
    }
    commit('setUnsavedChanges', false)
  },

  /**
   * Saves object to file.
   */
  async saveFile ({ state, rootState }, payload: { objectPath: string; file: string }) {
    const formData = new FormData()
    const filename = payload.file
    const data = get(state, payload.objectPath)
    console.log('got data', payload.objectPath, data)
    const file = new File([JSON.stringify(data)], filename)
    formData.append('file', file, filename)
    formData.append('root', 'config')
    console.debug('uploading configuration...', filename, data)
    Vue.$http.post(
      rootState.config?.apiUrl + '/server/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }
}
