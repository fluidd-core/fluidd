import Vue from 'vue'
import consola from 'consola'
import { MutationTree } from 'vuex'
import { ConfigState, UiSettings, GenericSave, InstanceConfig, Config, CardConfig } from './types'
import { Macro } from '../socket/types'
import { defaultState } from './index'
import { Globals } from '@/globals'
import { merge, set } from 'lodash-es'

export const mutations: MutationTree<ConfigState> = {
  resetState (state) {
    const newState = defaultState()
    Object.keys(newState).forEach((key: string) => {
      Vue.set(state, key, newState[key])
    })
  },

  /**
   * On initial init we get the server (moonraker) configuration.
   */
  onServerConfig (state, payload) {
    state.serverConfig = { ...state.serverConfig, ...payload }
  },

  /**
   * During init of the store, sets uiSettings.
   * This would be set on first app load after we've loaded
   * the configuration JSON (if any.. )
   */
  initUiSettings (state, payload: UiSettings) {
    // this should extend the default config as we
    // don't want to overrite defaults if not defined
    // in the file yet.
    if (payload) {
      state.uiSettings = merge(state.uiSettings, payload)
    } else {
      // If the user has not saved their own configuration yet,
      // then set any sane values over and above the base store state
      // here.
      // Get the api URL without a specific port, as the web cam is usually
      // hosted on 80.
      let camUrl
      let url
      try {
        url = new URL(state.apiUrl)
        camUrl = `${url.protocol}//${url.hostname}${state.uiSettings.camera.url}`
      } catch {
        camUrl = state.apiUrl + state.uiSettings.camera.url
      }
      state.uiSettings.camera.url = camUrl
    }
  },

  /**
   * Inits the console history from file
   */
  initConsoleHistory (state, payload: string[]) {
    if (payload) {
      state.consoleHistory = [...state.consoleHistory, ...payload]
    }
  },

  /**
   * Inits the print history from file
   */
  initPrintHistory (state, payload: any) {
    if (payload) {
      consola.debug('got some print history', payload)
    }
  },

  /**
   * During init of the store, sets localConfig.
   * This would usually be set once loaded from localStorage.
   */
  onInitLocal (state) {
    if (Globals.LOCAL_CARDSTATE_STORAGE_KEY in localStorage) {
      const config = JSON.parse(localStorage[Globals.LOCAL_CARDSTATE_STORAGE_KEY])
      Vue.set(state, 'cardState', config)
    }

    if (Globals.LOCAL_CARDLAYOUT_STORAGE_KEY in localStorage) {
      const config = JSON.parse(localStorage[Globals.LOCAL_CARDLAYOUT_STORAGE_KEY])
      Vue.set(state, 'cardLayout', config)
    }
  },

  /**
   * Sets the API and Socket URLS on first load and
   * ensure the instance is configured in local storage
   */
  onInitApiConfig (state, payload) {
    state.apiUrl = payload.apiUrl
    state.socketUrl = payload.socketUrl
  },

  onInitHostConfig (state, payload) {
    state.hostConfig.blacklist = payload.blacklist
    state.hostConfig.endpoints = payload.endpoints
    state.hostConfig.skipClientUpdates = payload.skipClientUpdates
  },

  onInitInstances (state, payload: Config) {
    let instances: InstanceConfig[] = []
    const apiConfig = payload.apiConfig
    // const uiSettings = payload.uiSettings
    const uiSettings = state.uiSettings
    if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
      instances = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY])
    }

    const i = instances.findIndex((instance: InstanceConfig) => instance.apiUrl === payload.apiConfig.apiUrl)
    if (i === -1) {
      if (
        (uiSettings || uiSettings === null) &&
        (apiConfig && apiConfig.apiUrl !== '' && apiConfig.socketUrl !== '')
      ) {
        // Ensures we only add instances we've had a successful connection to.
        instances.forEach(instance => { instance.active = false })
        instances.push({ ...apiConfig, active: true, name: state.uiSettings.general.instanceName })
      }
    } else {
      instances.forEach((instance, index) => {
        instance.active = (index === i)
        if (index === i) {
          instance.name = state.uiSettings.general.instanceName
        }
      })
    }
    localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(instances))
    Vue.set(state, 'instances', instances)
  },

  updateInstanceName (state, payload) {
    const index = state.instances.findIndex(instance => instance.apiUrl === payload.apiUrl)
    if (index > -1) {
      const instance = state.instances[index]
      Vue.set(state.instances, index, { ...instance, ...payload })
    }
    localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(state.instances))
  },

  removeInstance (state, payload) {
    const instances = state.instances
    const i = instances.findIndex((instance: InstanceConfig) => instance.apiUrl === payload.apiUrl)
    if (i >= 0) {
      instances.splice(i, 1)
      Vue.set(state, 'instances', instances)
      localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(instances))
    }
  },

  /**
   * This should only be used on properties that have a default state in the store
   * otherwise they will not be reactive.
   */
  onSaveGeneric (state, payload: GenericSave) {
    set(state, payload.key, payload.value)
  },

  saveCardState (state, payload) {
    const config = { ...state.cardState, ...payload }
    Vue.set(state, 'cardState', config)
    localStorage.setItem(Globals.LOCAL_CARDSTATE_STORAGE_KEY, JSON.stringify(config))
  },

  saveCardConfig (state, payload: { group: string; cards: CardConfig[] }) {
    state.cardLayout[payload.group] = payload.cards
    localStorage.setItem(Globals.LOCAL_CARDLAYOUT_STORAGE_KEY, JSON.stringify(state.cardLayout))
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
    const i = state.uiSettings.dashboard.hiddenMacros.indexOf(macro.name, 0)
    if (macro.visible && i >= 0) {
      state.uiSettings.dashboard.hiddenMacros.splice(i, 1)
    }
    if (!macro.visible && i < 0) {
      state.uiSettings.dashboard.hiddenMacros.push(macro.name)
    }
  },

  /**
   * Update / Add a temperature preset
   */
  updatePreset (state, payload) {
    const i = payload.index
    if (i >= 0) {
      Vue.set(state.uiSettings.dashboard.tempPresets, i, payload.preset)
    } else {
      state.uiSettings.dashboard.tempPresets.push(payload.preset)
    }
  },

  /**
   * Remove a preset
   */
  removePreset (state, payload) {
    state.uiSettings.dashboard.tempPresets.splice(payload, 1)
  },

  setLayoutMode (state, payload) {
    state.layoutMode = payload
  }
}
