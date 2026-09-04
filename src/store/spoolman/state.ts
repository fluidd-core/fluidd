import type { SpoolmanState } from './types'

export const state = (): SpoolmanState => {
  return {
    info: null,
    spools: [],
    activeSpool: null,
    currency: null,
    connected: false,
    dialog: {
      show: false
    },
    socket: null,
    socketDiagnostic: null
  }
}
