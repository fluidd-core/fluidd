import Vue from 'vue'
import Vuex from 'vuex'
import { socket } from './socket'
import { files } from './files'
import { config } from './config'
import { RootState } from './types'
import { FileConfig } from './config/types'

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
    files
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
    init ({ dispatch, commit }, payload: FileConfig) {
      // Should init the store, and ensure we've loaded our
      // configuration if there is any.
      commit('setVersion', process.env.VERSION)
      commit('setHash', process.env.HASH)
      const initLocal = dispatch('config/initLocal')
      const initFile = dispatch('config/initFile', payload)
      return Promise.all([initLocal, initFile])
    }
  }
})
