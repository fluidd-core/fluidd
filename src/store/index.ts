import Vue from 'vue'
import Vuex from 'vuex'
import consola from 'consola'
import { RootState } from './types'
import { InitConfig } from './config/types'

// Modules
import { socket } from './socket'
import { auth } from './auth'
import { server } from './server'
import { printer } from './printer'
import { config } from './config'
import { files } from './files'
import { layout } from './layout'
import { charts } from './charts'
import { console } from './console'
import { macros } from './macros'
import { power } from './power'
import { history } from './history'
import { version } from './version'
import { cameras } from './cameras'
import { mesh } from './mesh'
import { notifications } from './notifications'
import { announcements } from './announcements'
import { wait } from './wait'
import { gcodePreview } from './gcodePreview'
import { timelapse } from './timelapse'
import { parts } from './parts'
import { webcams } from './webcams'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  strict: (import.meta.env.DEV),
  modules: {
    socket,
    auth,
    server,
    printer,
    config,
    files,
    layout,
    charts,
    console,
    macros,
    power,
    history,
    version,
    cameras,
    mesh,
    notifications,
    announcements,
    wait,
    gcodePreview,
    timelapse,
    parts,
    webcams
  },
  mutations: {},
  actions: {
    /**
     * Resets all stores
     */
    async reset ({ dispatch }, payload: string[]) {
      // Reset our color set.
      Vue.$colorset.forceResetAll()

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
      commit('version/setVersion', import.meta.env.VERSION)
      commit('version/setHash', import.meta.env.HASH)

      // Set the api connection state..
      commit('socket/setApiConnected', payload.apiConnected)

      // Init the host and local configs..
      return [
        await dispatch('config/initHost', payload),
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
