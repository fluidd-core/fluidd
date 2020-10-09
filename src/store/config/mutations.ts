import Vue from 'vue'
import { MutationTree } from 'vuex'
import { ConfigState, FileConfig, GenericSave } from './types'
import { Macro } from '../socket/types'
import { merge, set } from 'lodash-es'

export const mutations: MutationTree<ConfigState> = {
  /**
   * During init of the store, sets localConfig.
   * This would usually be set once loaded from localStorage.
   */
  onInitLocal (state, payload) {
    for (const o in payload) {
      Vue.set(state.localConfig, o, payload[o])
    }
  },

  /**
   * During init of the store, sets fileConfig.
   * This would be set on first app load after we've loaded
   * the configuration JSON.
   */
  onInitFile (state, payload: FileConfig) {
    // this should extend the default config as we
    // don't want to overrite defaults if not defined
    // in the file yet.
    state.fileConfig = merge(state.fileConfig, payload)
  },

  /**
   * Sets the API and Socket URLS on first load.
   */
  onInitApiConfig (state, payload) {
    state.apiUrl = payload.apiUrl
    state.socketUrl = payload.socketUrl
  },

  /**
   * This should only be used on properties that have a default state in the store
   * otherwise they will not be reactive.
   */
  onSaveGeneric (state, payload: GenericSave) {
    set(state, payload.key, payload.value)
  },

  /**
   * Explicitly saves to the localConfig, which matches localStorage.
   */
  onSaveLocal (state, payload: GenericSave) {
    state.localConfig[payload.key] = payload.value
  },

  /**
   * Sets unsaved changes for file config.
   */
  setUnsavedChanges (state, payload: boolean) {
    state.unsavedChanges = payload
  },

  /**
   * Updates the hidden macro list.
   */
  updateHiddenMacros (state, macro: Macro) {
    const i = state.fileConfig.dashboard.hiddenMacros.indexOf(macro.name, 0)
    if (macro.visible && i >= 0) {
      state.fileConfig.dashboard.hiddenMacros.splice(i, 1)
    }
    if (!macro.visible && i < 0) {
      state.fileConfig.dashboard.hiddenMacros.push(macro.name)
    }
  }
}
