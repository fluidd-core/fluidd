import type { ServerState } from './types'

export const defaultState = (): ServerState => {
  return {
    klippy_retries: 0, // how many times have we attempted to reconnect to klippy.
    info: {
      failed_components: [],
      klippy_connected: false, // indicates if klippy is disconnected vs shutdown.
      klippy_state: 'disconnected',
      components: [],
      registered_directories: [],
      warnings: []
    },
    system_info: null,
    peripherals: {
      usb_devices: null,
      serial_devices: null,
      v4l2_devices: null,
      libcamera_devices: null
    },
    can_uuids: null,
    config: {
      server: {}
    },
    moonraker_stats: [],
    throttled_state: {
      bits: 0,
      flags: []
    },
    cpu_temp: null,
    system_cpu_usage: null,
    system_uptime: null,
    websocket_connections: null
  }
}

export const state = defaultState()
