import { consola } from 'consola'
import Vue from 'vue'
import Vuex, { type StoreOptions } from 'vuex'
import type { RootActions, RootGetters, RootModules, RootMutations, RootState } from './types'

// Modules
import { afc } from './afc'
import { analysis } from './analysis'
import { announcements } from './announcements'
import { auth } from './auth'
import { charts } from './charts'
import { config } from './config'
import { console } from './console'
import { database } from './database'
import { extensions } from './extensions'
import { files } from './files'
import { firmware } from './firmware'
import { gcodePreview } from './gcodePreview'
import { history } from './history'
import { jobQueue } from './jobQueue'
import { layout } from './layout'
import { macros } from './macros'
import { mesh } from './mesh'
import { mmu } from './mmu'
import { notifications } from './notifications'
import { power } from './power'
import { printer } from './printer'
import { sensors } from './sensors'
import { server } from './server'
import { socket } from './socket'
import { spoolman } from './spoolman'
import { timelapse } from './timelapse'
import { version } from './version'
import { wait } from './wait'
import { webcams } from './webcams'

Vue.use(Vuex)

export const storeOptions = {
  strict: import.meta.env.DEV,
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
    firmware,
    mesh,
    notifications,
    announcements,
    extensions,
    wait,
    gcodePreview,
    timelapse,
    webcams,
    jobQueue,
    spoolman,
    mmu,
    sensors,
    database,
    analysis,
    afc
  } satisfies RootModules,
  mutations: {},
  actions: {
    /**
     * Resets all stores
     */
    async reset({ dispatch }, payload: string[] | undefined) {
      // Reset our color set.
      Vue.$colorset.forceResetAll()

      // Dispatch a reset for each registered module.
      const p: Promise<unknown>[] = []
      const keys = payload || Object.keys(this.state)
      keys.forEach(key => {
        if (this.hasModule(key)) {
          p.push(dispatch(key + '/reset'))
        }
      })
      await Promise.all(p)
    },

    async resetKlippy({ dispatch, commit }) {
      commit('socket/setAcceptNotifications', false)

      await Promise.all([
        dispatch('server/resetKlippy'),
        dispatch('charts/resetChartStore'),
        dispatch('reset', ['printer', 'wait'])
      ])
    },

    /**
     * A void action. Some socket commands may not need processing.
     */
    void(_, payload: unknown) {
      consola.debug('void action', payload)
    }
  }
} satisfies StoreOptions<RootState>

export class TypedStore extends Vuex.Store<RootState> {
  get typedGetters(): RootGetters {
    return this.getters as RootGetters
  }

  typedCommit: RootMutations = (...params) => {
    this.commit(...params)
  }

  typedDispatch: RootActions = (...params) => {
    return this.dispatch(...params)
  }
}

export default new TypedStore(storeOptions)
