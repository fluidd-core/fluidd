import Vue from 'vue'
import Vuex, { type StoreOptions } from 'vuex'
import { consola } from 'consola'
import type { RootActions, RootGetters, RootModules, RootMutations, RootState } from './types'

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
import { webcams } from './webcams'
import { jobQueue } from './jobQueue'
import { spoolman } from './spoolman'
import { mmu } from './mmu'
import { sensors } from './sensors'
import { database } from './database'
import { analysis } from './analysis'
import { afc } from './afc'

Vue.use(Vuex)

export const storeOptions = {
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
    async reset ({ dispatch }, payload: string[] | undefined) {
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

    async resetKlippy ({ dispatch, commit }) {
      commit('socket/setAcceptNotifications', false)

      await Promise.all([
        dispatch('server/resetKlippy'),
        dispatch('charts/resetChartStore'),
        dispatch('reset', [
          'printer',
          'wait'
        ])
      ])
    },

    /**
     * A void action. Some socket commands may not need processing.
     */
    void (_, payload: unknown) {
      consola.debug('void action', payload)
    }
  }
} satisfies StoreOptions<RootState>

export class TypedStore extends Vuex.Store<RootState> {
  get typedGetters (): RootGetters {
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
