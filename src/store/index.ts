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
    version: '0.0.3',
    darkMode: true
  },
  modules: {
    config,
    socket,
    files
  },
  mutations: {
    setDarkMode (state, payload: boolean) {
      console.log('setting darkmode', payload)
      // this.$store.commit('setDarkMode', value)
      state.darkMode = payload
    }
  },
  actions: {
    init ({ dispatch }, payload: FileConfig) {
      // Should init the store, and ensure we've loaded our
      // configuration if there is any.
      const initLocal = dispatch('config/initLocal')
      const initFile = dispatch('config/initFile', payload)
      return Promise.all([initLocal, initFile])
    }
  }
})
