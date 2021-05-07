import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { NotificationsState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): NotificationsState => {
  return {
    notifications: []

    // status:
    // printer.mcu.last_stats
    // printer.system_stats

    // notifications:
    // notify_cpu_throttled (to detect a throttle condition like under volt etc)

    // actions:
    // machine.proc.stats

    // cpu overtemp
    // mcu overtemp

    // mcu awake time graphing

    // If it was me, I'd probably just start with displaying everything on a single graph with 100% being one core usage.  So, just graph sysload outright (sysload * 100), cputime change ((cputime - last_cputime) * 100), mcu_awake (formula above), mcu load (formula above).

  }
}

export const state = defaultState()

const namespaced = true

export const notifications: Module<NotificationsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
