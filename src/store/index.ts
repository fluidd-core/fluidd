import Vue from 'vue'
import Vuex from 'vuex'
import { consola } from 'consola'
import type { RootState } from './types'
import type { InitConfig } from './config/types'

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
import { mesh } from './mesh'
import { notifications } from './notifications'
import { announcements } from './announcements'
import { wait } from './wait'
import { gcodePreview } from './gcodePreview'
import { timelapse } from './timelapse'
import { parts } from './parts'
import { webcams } from './webcams'
import { jobQueue } from './jobQueue'
import { spoolman } from './spoolman'
import { sensors } from './sensors'

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
    mesh,
    notifications,
    announcements,
    wait,
    gcodePreview,
    timelapse,
    parts,
    webcams,
    jobQueue,
    spoolman,
    sensors
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
      const p: Promise<unknown>[] = []
      const keys = payload || Object.keys(this.state)
      keys.forEach((key) => {
        if (this.hasModule(key)) {
          p.push(dispatch(key + '/reset'))
        }
      })
      await Promise.all(p)
    },

    async init ({ dispatch, commit }, payload: InitConfig) {
      // Set the api connection state..
      commit('socket/setApiConnected', payload.apiConnected)

      // Init the host and local configs..
      await Promise.all([
        dispatch('config/initHost', payload),
        dispatch('config/initLocal', payload)
      ])

      commit('config/setAppReady', true)
    },

    /**
     * A void action. Some socket commands may not need processing.
     */
    void (_, payload) {
      consola.debug('void action', payload)
    }
  }
})
