import Vue from 'vue'
import Vuex from 'vuex'
import consola from 'consola'
import { RootState } from './types'
import { InitConfig } from './config/types'

// Modules
import { socket } from './socket'
import { server } from './server'
import { printer } from './printer'
import { config } from './config'
import { files } from './files'
import { charts } from './charts'
import { console } from './console'
import { macros } from './macros'
import { devicePower } from './devicePower'
import { history } from './history'
import { version } from './version'
import { cameras } from './cameras'
import { mesh } from './mesh'
import { wait } from './wait'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  strict: (process.env.NODE_ENV === 'development'),
  state: {},
  modules: {
    socket,
    server,
    printer,
    config,
    files,
    charts,
    console,
    macros,
    devicePower,
    history,
    version,
    cameras,
    mesh,
    wait
  },
  mutations: {},
  actions: {
    /**
     * Resets all stores
     */
    async reset ({ dispatch }, payload: string[]) {
      // Reset our color set.
      Vue.$colorset.resetAll()

      // Dispatch a reset for each registered module.
      const p: Promise<any>[] = []
      const keys = payload || Object.keys(this.state)
      keys.forEach((key) => {
        if (this.hasModule(key)) {
          p.push(dispatch(key + '/reset'))
        }
      })
      return Promise.all(p)
    },

    async init ({ dispatch, commit }, payload: InitConfig) {
      // Sets the version and hash of Fluidd.
      commit('version/setVersion', process.env.VERSION)
      commit('version/setHash', process.env.HASH)

      // Init the host and local configs..
      return [
        await dispatch('config/initHost', payload.hostConfig),
        await dispatch('config/initLocal', payload)
      ]
    },

    /**
     * A void action. Some socket commands may not need processing.
     */
    void (_, payload) {
      consola.debug('void action', payload)
    }
  }
})
