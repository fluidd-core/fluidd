import Vue from 'vue'
import Vuex from 'vuex'
import consola from 'consola'
import { socket } from './socket'
import { files } from './files'
import { config } from './config'
import { devicePower } from './devicePower'
import { version } from './version'
import { wait } from './wait'
import { RootState } from './types'
import { InitConfig } from './config/types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  strict: (process.env.NODE_ENV === 'development'),
  state: {
    consoleCommand: ''
  },
  modules: {
    config,
    socket,
    files,
    devicePower,
    version,
    wait
  },
  mutations: {
    setConsoleCommand (state, payload) {
      state.consoleCommand = payload
    }
  },
  actions: {
    async init ({ dispatch, commit }, payload: InitConfig) {
      // Should init the store, and ensure we've loaded our
      // configuration if there is any.
      commit('version/setVersion', process.env.VERSION)
      commit('version/setHash', process.env.HASH)
      if (payload.fileConfig !== undefined) {
        for (const key in payload.fileConfig) {
          await dispatch('config/init' + key, payload.fileConfig[key])
        }
      }
      const initHost = await dispatch('config/initHost', payload.hostConfig)
      const initLocal = await dispatch('config/initLocal', payload)
      return [initHost, initLocal]
    },
    async reset () {
      // Reset the entire store - should be used when swapping instances.
      // extend this so we can pass an object defining what to reset, and if its a full reset or not.
      Vue.$colorset.resetAll()
      this.commit('socket/resetState', true)
      this.commit('config/resetState')
      this.commit('files/resetState')
      this.commit('devicePower/resetState')
      this.commit('version/resetState')
      this.commit('wait/resetState')
    },
    void () {
      consola.debug('void action')
    }
  }
})
