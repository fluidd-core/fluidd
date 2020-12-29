import { MutationTree } from 'vuex'
import { WaitState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<WaitState> = {
  resetState (state) {
    const newState = defaultState()
    state.waits = newState.waits

    // Object.keys(newState).forEach((key: string) => {
    //   Vue.set(state, key, newState[key])
    // })
  },
  addWait (state, payload) {
    // ensure we can't add a wait that may already exist.
    const i = state.waits.findIndex(wait => wait === payload)
    if (i === -1) state.waits.push(payload)
  },
  removeWait (state, payload) {
    if (state.waits.length) {
      state.waits.splice(state.waits.indexOf(payload, 0), 1)
    }
  }
}
