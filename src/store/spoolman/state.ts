import { SpoolmanState } from '@/store/spoolman/types'

export const defaultState = (): SpoolmanState => {
  return {
    availableSpools: [],
    activeSpool: undefined,
    supported: false
  }
}

export const state = defaultState()
