import Vue from 'vue'
import { ActionTree } from 'vuex'
import { ConfigState, GenericSave, Config, InstanceConfig, FileConfig, HostConfig, CardConfig, CardState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const actions: ActionTree<ConfigState, RootState> = {
  /**
   * Inits any file config we may have.
   */
  async initFile ({ commit }, payload: FileConfig) {
    commit('onInitFile', payload)
  },

  /**
   * Inits the host configuration.
   */
  async initHost ({ commit }, payload: HostConfig) {
    commit('onInitHost', payload)
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
   * Saves keys to file storage. Assumes a root[key] structure
   * under state.config
   */
  async saveGeneric ({ commit, dispatch }, config: GenericSave) {
    // commit('setUnsavedChanges', true)
    commit('onSaveGeneric', config)
    dispatch('saveFileConfig')
  },

  /**
   *
   */
  async updateHiddenMacros ({ commit, dispatch }, payload) {
    // commit('setUnsavedChanges', true)
    commit('updateHiddenMacros', payload)
    dispatch('saveFileConfig')
  },

  /**
   * Add or update a given preset
   */
  async updatePreset ({ commit, dispatch }, payload) {
    commit('setUnsavedChanges', true)
    commit('updatePreset', payload)
    dispatch('saveFileConfig')
  },

  async removePreset ({ commit, dispatch }, payload) {
    commit('setUnsavedChanges', true)
    commit('removePreset', payload)
    dispatch('saveFileConfig')
  },

  /**
   * Saves fileConfig to file.
   */
  async saveFileConfig ({ commit, dispatch, state, rootState, rootGetters }) {
    let instance = rootGetters['config/getCurrentInstance']
    if (instance) {
      instance = { ...instance, ...{ name: state.fileConfig.general.instanceName } }
      dispatch('updateInstance', instance)
    }

    if (state.fileConfig && Object.keys(state.fileConfig).length > 0) {
      const formData = new FormData()
      const filename = Globals.SETTINGS_FILENAME
      const file = new File([JSON.stringify(state.fileConfig)], filename)
      formData.append('file', file, filename)
      formData.append('root', 'config')
      console.debug('uploading configuration...', filename, state.fileConfig)
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
    commit('setUnsavedChanges', false)
  }
}
