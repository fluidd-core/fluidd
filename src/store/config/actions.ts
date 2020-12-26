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
  async saveGeneric ({ commit }, config: GenericSave) {
    commit('setUnsavedChanges', true)
    commit('onSaveGeneric', config)
  },

  /**
   *
   */
  async updateHiddenMacros ({ commit }, payload) {
    commit('setUnsavedChanges', true)
    commit('updateHiddenMacros', payload)
  },

  /**
   * Add or update a given preset
   */
  async updatePreset ({ commit }, payload) {
    commit('setUnsavedChanges', true)
    commit('updatePreset', payload)
  },

  async removePreset ({ commit }, payload) {
    commit('setUnsavedChanges', true)
    commit('removePreset', payload)
  },

  /**
   * Saves fileConfig to file.
   */
  async saveFileConfig ({ commit, state, rootState }) {
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
