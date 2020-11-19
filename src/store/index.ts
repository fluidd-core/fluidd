import Vue from 'vue'
import Vuex from 'vuex'
import { socket } from './socket'
import { files } from './files'
import { config } from './config'
import { devicePower } from './devicePower'
import { RootState } from './types'
import { Config } from './config/types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  strict: (process.env.NODE_ENV === 'development'),
  state: {
    version: '',
    hash: ''
  },
  modules: {
    config,
    socket,
    files,
    devicePower
  },
  mutations: {
    setVersion (state, payload) {
      state.version = payload
    },
    setHash (state, payload) {
      state.hash = payload
    }
  },
  actions: {
    async init ({ dispatch, commit }, payload: Config) {
      // Should init the store, and ensure we've loaded our
      // configuration if there is any.
      commit('setVersion', process.env.VERSION)
      commit('setHash', process.env.HASH)
      const initFile = await dispatch('config/initFile', payload.fileConfig)
      const initLocal = await dispatch('config/initLocal', payload)
      return [initLocal, initFile]
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
