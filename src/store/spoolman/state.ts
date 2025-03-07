import type { SpoolmanState } from '@/store/spoolman/types'

export const defaultState = (): SpoolmanState => {
  return {
    info: null,
    availableSpools: [],
    activeSpool: null,
    currency: null,
    connected: false,
    dialog: {
      show: false
    }
  }
}

export const state = defaultState()
