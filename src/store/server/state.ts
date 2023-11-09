import type { ServerState } from './types'

export const defaultState = (): ServerState => {
  return {
    klippy_retries: 0, // how many times have we attempted to reconnect to klippy.
    info: {
      failed_components: [],
      klippy_connected: false, // indicates if klippy is disconnected vs shutdown.
      klippy_state: '',
      components: [],
      registered_directories: [],
      warnings: []
    },
    system_info: null,
    config: {
      authorization: {
        enabled: true
      },
      server: {}
    },
    moonraker_stats: [],
    throttled_state: {
      bits: 0,
      flags: []
    },
    cpu_temp: null
  }
}

export const state = defaultState()
