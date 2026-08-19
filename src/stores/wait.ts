import { defineStore } from 'pinia'

export interface WaitState {
  waits: string[];
}

export const useWaitStore = defineStore('wait', {
  state: (): WaitState => ({
    waits: []
  }),

  getters: {
    hasWait: (state) => (wait: string | string[]): boolean => {
      if (Array.isArray(wait)) {
        return wait.some(val => state.waits.includes(val))
      } else {
        return state.waits.includes(wait)
      }
    },

    hasWaits: (state) => state.waits.length > 0,

    hasWaitsBy: (state) => (prefix: string) => {
      return state.waits.some(wait => wait.startsWith(prefix))
    }
  },

  actions: {
    addWait (wait: string) {
      if (!this.waits.includes(wait)) this.waits.push(wait)
    },

    removeWait (wait: string) {
      const i = this.waits.indexOf(wait)
      if (i !== -1) this.waits.splice(i, 1)
    }
  }
})
