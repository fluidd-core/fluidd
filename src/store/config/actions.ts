import Vue from 'vue'
import { ActionTree } from 'vuex'
import { ConfigState, FileConfig, LocalConfig, GenericSave } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const actions: ActionTree<ConfigState, RootState> = {
  /**
   * Inits any local storage state we may have.
   */
  async initLocal ({ commit }) {
    if (Globals.LOCAL_STORAGE_KEY in localStorage) {
      const config = JSON.parse(localStorage.appConfig)
      commit('onInitLocal', config)
    }
  },

  /**
   * Inits any file config we may have.
   */
  async initFile ({ commit }, config: FileConfig) {
    if (config) {
      commit('onInitFile', config)
    }
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
   * Saves local keys to state and localstorage.
   * Assumes a flat structure of key value pairs.
   */
  async saveLocalStorage ({ commit }, payload: LocalConfig) {
    let config = (Globals.LOCAL_STORAGE_KEY in localStorage) ? JSON.parse(localStorage.appConfig) : {}
    config = { ...config, ...payload }
    localStorage.setItem(Globals.LOCAL_STORAGE_KEY, JSON.stringify(config))
    for (const key in payload) {
      commit('onSaveLocal', { key, value: payload[key] })
    }
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
