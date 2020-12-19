import Vue from 'vue'
import Vuex from 'vuex'
import { socket } from './socket'
import { files } from './files'
import { config } from './config'
import { devicePower } from './devicePower'
import { version } from './version'
import { RootState } from './types'
import { Config } from './config/types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  strict: (process.env.NODE_ENV === 'development'),
  state: {},
  modules: {
    config,
    socket,
    files,
    devicePower,
    version
  },
  mutations: {},
  actions: {
    async init ({ dispatch, commit }, payload: Config) {
      // Should init the store, and ensure we've loaded our
      // configuration if there is any.
      commit('version/setVersion', process.env.VERSION)
      commit('version/setHash', process.env.HASH)
      const initFile = await dispatch('config/initFile', payload.fileConfig)
      const initHost = await commit('version/setSkipClientUpdates', payload.hostConfig) // this should move to the config module if we ever add to it.
      const initLocal = await dispatch('config/initLocal', payload)
      return [initFile, initHost, initLocal]
    },
    reset () {
      // Reset the entire store - should be used when swapping instances.
      // extend this so we can pass an object defining what to reset, and if its a full reset or not.
      this.commit('socket/resetState')
      this.commit('config/resetState')
      this.commit('files/resetState')
      this.commit('devicePower/resetState')
    },
    void () {
      console.debug('void action')
    }
  }
})
