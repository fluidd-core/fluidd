import { SpoolmanState } from '@/store/spoolman/types'

export const defaultState = (): SpoolmanState => {
  return {
    availableSpools: [],
    activeSpool: undefined,
    supported: false,
    dialog: {
      show: false,
      filename: ''
    }
  }
}

export const state = defaultState()
