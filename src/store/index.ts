import Vue from 'vue'
import Vuex, { type StoreOptions } from 'vuex'
import { consola } from 'consola'
import type { RootActions, RootGetters, RootModules, RootMutations, RootState } from './types'
import { resetPiniaStores } from '@/stores'
import { useWaitStore } from '@/stores/wait'

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
import { gcodePreview } from './gcodePreview'
import { timelapse } from './timelapse'
import { webcams } from './webcams'
import { jobQueue } from './jobQueue'
import { spoolman } from './spoolman'
import { mmu } from './mmu'
import { sensors } from './sensors'
import { database } from './database'
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
    gcodePreview,
    timelapse,
    webcams,
    jobQueue,
    spoolman,
    mmu,
    sensors,
    database,
    afc
  } satisfies RootModules,
  mutations: {},
  actions: {
    /**
     * Resets all stores. `payload` names Vuex modules only; Pinia stores are
     * reset in full when no payload is given, individually by their owner otherwise.
     */
    async reset ({ dispatch }, payload?: (keyof RootState)[]) {
      // Reset our color set.
      Vue.$colorset.forceResetAll()

      if (!payload) {
        resetPiniaStores()
      }

      const keys = payload ?? Object.keys(this.state) as (keyof RootState)[]

      await Promise.all(keys.map(key => dispatch(`${key}/reset`)))
    },

    async resetKlippy ({ dispatch, commit }) {
      commit('socket/setAcceptNotifications', false)

      useWaitStore().$reset()

      await Promise.all([
        dispatch('server/resetKlippy'),
        dispatch('charts/resetChartStore'),
        dispatch('reset', [
          'printer'
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
