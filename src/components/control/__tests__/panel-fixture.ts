import Vue from 'vue'
import { vi } from 'vitest'

export function panelStore () {
  const printer = Vue.observable<any>({
    toolhead: { position: [100, 87, 12.4, 0], axis_minimum: [0, -10, 0], axis_maximum: [200, 174, 160], homed_axes: 'xyz', max_velocity: 800, max_accel: 20000, square_corner_velocity: 7, minimum_cruise_ratio: 0.5 },
    gcode_move: { speed_factor: 1, extrude_factor: 1 },
    configfile: { settings: {}, config: {} },
    firmware_retraction: { retract_length: 0.8, retract_speed: 35, unretract_extra_length: 0, unretract_speed: 35 }
  })
  const extruder = Vue.observable<any>({ temperature: 215, can_extrude: true, min_extrude_temp: 170, pressure_advance: 0.076, config: { max_extrude_only_velocity: 20, max_extrude_only_distance: 50 } })
  const getters = Vue.observable<Record<string, any>>({
    'auth/getAuthenticated': true,
    'socket/getConnectionState': true,
    'socket/getApiConnected': true,
    'printer/getKlippyReady': true,
    'printer/getKlippyConnected': true,
    'printer/getKlippyState': 'ready',
    'printer/getPrinterState': 'ready',
    'printer/getHasExtruder': true,
    'printer/getActiveExtruder': extruder,
    'printer/getHeaters': [
      { name: 'extruder', temperature: 214.6, target: 215, power: 0.41, maxTemp: 265 },
      { name: 'heater_bed', temperature: 59.8, target: 60, power: 0.18, maxTemp: 110 }
    ],
    'printer/getSensors': [{ name: 'temperature_sensor CPU', prettyName: 'CPU', temperature: 52.3 }],
    'config/getTempPresets': [],
    'printer/getAllFans': [],
    'printer/getPins': [],
    'printer/getAllLeds': [],
    'printer/getRunoutSensors': [],
    'printer/getEndstops': [],
    'macros/getMacros': [],
    'spoolman/getActiveSpool': null,
    'printer/getTimeEstimates': { eta: 0 },
    'wait/hasWait': () => false
  })
  const state = Vue.observable<any>({ printer: { printer }, config: { apiUrl: 'http://mock.local', instances: [], uiSettings: { general: { defaultToolheadXYSpeed: 130, defaultToolheadZSpeed: 10, defaultExtrudeLength: 10, defaultExtrudeSpeed: 5 } } }, console: { console: [], commandHistory: [] }, gcodePreview: {} })
  return { state, getters, dispatch: vi.fn(), commit: vi.fn(), subscribe: vi.fn(() => vi.fn()), extruder }
}

export const panelStubs = { 'frame-icon': true, 'v-progress-circular': true }
export const waits = { onHomeXY: 'homeXY', onHomeZ: 'homeZ', onHomeAll: 'homeAll' }
