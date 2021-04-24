import Vue from 'vue'
import { GetterTree } from 'vuex'
import { RootState } from '../types'
import { PrinterState, Heater, Fan, OutputPin, TimeEstimates, Sensor, RunoutSensor, Extruder } from './types'
import { get } from 'lodash-es'
import { getKlipperType } from '../helpers'

export const getters: GetterTree<PrinterState, RootState> = {

  /**
   * Indicates if klippy is connected or not.
   */
  getklippyReady: (state, getters, rootState, rootGetters): boolean => {
    // Valid states are;
    // ready, startup, shutdown, error
    const serverInfo = rootGetters['server/getInfo']
    const server_klippy_state = serverInfo.klippy_state || ''
    if (
      server_klippy_state !== 'ready' ||
      server_klippy_state !== 'ready'
    ) {
      return false
    }
    return true
  },

  getKlippyState: (state, getters, rootState, rootGetters): string => {
    const serverInfo = rootGetters['server/getInfo']
    const server_klippy_state = serverInfo.klippy_state || ''
    return Vue.$filters.capitalize(server_klippy_state)
    // if (state1 === state2) {
    //   return Vue.$filters.capitalize(state1)
    // }
    // if (state1 !== 'ready' && state1 !== '') {
    //   return Vue.$filters.capitalize(state1)
    // }
    // if (state2 !== 'ready' && state1 !== '') {
    //   return Vue.$filters.capitalize(state2)
    // }
    // return state1
  },

  getKlippyStateMessage: (state, getters, rootState, rootGetters): string => {
    const regex = /(?:\r\n|\r|\n)/g
    // If there's absolutely no connection to klipper, then
    // say so.
    const serverInfo = rootGetters['server/getInfo']
    if (serverInfo.klippy_connected === false) {
      return 'Klippy not connected.'
    }

    // If an external source fires an estop, or the client
    // is refreshed while klipper is down - the webhook data maybe invalid
    // but the printer info should be good.
    if (
      state.printer.info.state_message &&
      state.printer.info.state_message !== ''
    ) {
      return state.printer.info.state_message.trim().replace(regex, '<br />')
    }
    if (
      state.printer.webhooks.state_message &&
      state.printer.webhooks.state_message !== ''
    ) {
      return state.printer.webhooks.state_message.trim().replace(regex, '<br />')
    }
    return 'Unknown'
  },

  /**
   * Returns a string value indicating the state of the printer.
   */
  getPrinterState: (state): string => {
    const state1 = state.printer.idle_timeout.state // printing, ready, idle
    const state2 = state.printer.print_stats.state // printing, paused, standby, complete
    // If the idle state says we're printing, bnut the print_stats say otherwise - then
    // we're probably busy moving the toolhead or doing some other process.
    // Possible values are;
    // printing, busy, paused, ready, idle, standby
    if (state1 && state2) {
      if (
        state2.toLowerCase() === 'paused'
      ) {
        return state2.toLowerCase()
      }
      if (
        state1.toLowerCase() === 'printing' &&
        state2.toLowerCase() !== 'printing'
      ) {
        // The printers idle_timeout changes to printing when it's busy applying
        // some change - but not necessarily printing anything. This state hopefully
        // helps aleviate that confusion.
        return 'busy'
      }
      return state1.toLowerCase()
    } else {
      return 'loading'
    }
  },

  getPrintProgress: (state, getters, rootState) => {
    const type = rootState.config?.uiSettings.general.printTimeEstimationsType || 'file'
    if (type === 'slicer') {
      return state.printer.display_status.progress || 0
    } else {
      return state.printer.virtual_sdcard.progress || 0
    }
  },

  /**
   * Returns an object representing the time estimates of a current print.
   */
  getTimeEstimates: (state, getters, rootState): TimeEstimates => {
    const type = rootState.config?.uiSettings.general.printTimeEstimationsType || 'file'
    const speedCorrection = rootState.config?.uiSettings.general.accountForSpeed || false
    const progress = getters.getPrintProgress
    const current = (
      'print_stats' in state.printer &&
      'print_duration' in state.printer.print_stats
    )
      ? state.printer.print_stats.print_duration
      : 0
    let total = 0
    let remaining = 0

    switch (type) {
      case 'slicer': {
        if (
          'current_file' in state.printer &&
          'estimated_time' in state.printer.current_file
        ) {
          total = state.printer.current_file.estimated_time
        }
        remaining = (total - current)
        break
      }
      case 'filament': {
        if (
          'print_stats' in state.printer &&
          'current_file' in state.printer &&
          'filament_used' in state.printer.print_stats &&
          'filament_total' in state.printer.current_file &&
          state.printer.print_stats.filament_used > 0
        ) {
          total = current / (state.printer.print_stats.filament_used / state.printer.current_file.filament_total)
        }
        remaining = total - current
        break
      }
      case 'file': {
        total = (progress > 0 && current > 0)
          ? current / progress
          : current
        remaining = total - current
        break
      }
      case 'totals': { // totals only.
        total = 0
        remaining = 0
        break
      }
      default: { // totals only.
        total = 0
        remaining = 0
      }
    }

    if (speedCorrection) { // Account for the speed.
      const speed = state.printer.gcode_move.speed_factor - 1
      remaining = remaining - (remaining * speed)
    }

    return {
      type,
      progress: (progress * 100).toFixed(), // percent
      total: Vue.$filters.formatCounterTime(total), // total estimated time
      current: Vue.$filters.formatCounterTime(current), // current duration / time
      remaining: Vue.$filters.formatCounterTime(remaining) // remaining time
    }
  },

  /**
   * Given axes, returns a boolean indicating if the axes are homed.
   */
  getHomedAxes: (state) => (axes?: string): boolean => {
    if (axes && axes.length > 0) {
      let r = false
      const a = axes.split('')
      a.forEach((char) => {
        r = state.printer.toolhead.homed_axes.includes(char)
      })
      return r
    }
    return false
  },

  /**
   * Return a runout sensor's data by name
   */
  getRunoutSensorByName: (state) => (name: string): RunoutSensor | undefined => {
    const sensor = get(state.printer, 'filament_switch_sensor ' + name, undefined)
    if (sensor) {
      return {
        name,
        ...sensor
      }
    }
    return undefined
  },

  getRunoutSensors: (state): RunoutSensor[] => {
    const supportedSensors = ['filament_switch_sensor']
    const sensors: RunoutSensor[] = []
    for (const item in state.printer) {
      const split = item.split(' ')

      if (supportedSensors.includes(split[0])) {
        const name = (split.length > 1) ? split[1] : item
        const sensor = get(state.printer, 'filament_switch_sensor ' + name, undefined)
        sensors.push({
          name,
          ...sensor
        })
      }
    }
    return sensors
  },

  getEndstops: (state) => {
    const sorted: { [index: string]: string } = {}
    Object.keys(state.printer.endstops).sort().forEach((key) => {
      sorted[key] = state.printer.endstops[key]
    })
    return sorted
  },

  /**
   * Return available heaters
   */
  getHeaters: (state, getters): Heater[] => {
    const heaters = state.printer.heaters.available_heaters || []
    if (
      heaters.length
    ) {
      const r: Heater[] = []
      heaters.forEach((e: string) => {
        const heater = state.printer[e]
        if (heater && Object.keys(heater).length > 0) {
          const config = getters.getPrinterSettings(e)
          // Some heater items may have a prefix determining type.
          // Check for these and split as necessary.
          const keys = [
            'heater_generic'
          ]

          let name = e
          const split = e.split(' ')
          if (split.length > 1 && keys.includes(split[0])) {
            split.shift()
            name = split.join(' ')
          }

          // const color = (name === 'heater_bed')
          //   ? Vue.$colorset.next('bed', e)
          //   : Vue.$colorset.next('heater', e)
          const color = Vue.$colorset.next(getKlipperType(e), e)
          const prettyName = Vue.$filters.startCase(name)

          r.push({
            ...heater,
            name,
            color,
            prettyName,
            key: e,
            minTemp: (config && config.min_temp) ? config.min_temp : undefined,
            maxTemp: (config && config.max_temp) ? config.max_temp : undefined
          })
        }
      })
      return r.sort((a: Heater, b: Heater) => {
        const name1 = a.name.toUpperCase()
        const name2 = b.name.toUpperCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })
    }
    return []
  },

  getAllFans: (_, getters) => {
    return getters.getOutputs([
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'fan'
    ])
  },

  /**
   * Return toolhead fans
   */
  getToolHeadFans: (_, getters) => {
    return getters.getOutputs([
      // 'temperature_fan',
      // 'controller_fan',
      'heater_fan',
      // 'fan_generic',
      'fan'
    ])
  },

  getOtherFans: (_, getters) => {
    return getters.getOutputs([
      'temperature_fan',
      'controller_fan',
      // 'heater_fan',
      'fan_generic'
      // 'fan'
    ])
  },

  /**
   * Return output pins
   */
  getPins: (_, getters) => {
    const outputs = getters.getOutputs([
      'output_pin'
    ])
    return outputs.sort((output: OutputPin) => output.pwm ? 1 : 1)
  },

  /**
  * Return available fans and output pins
  */
  getOutputs: (state, getters) => (filter?: string[]): Array<Fan | OutputPin> => {
    const fans = [
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'fan'
    ]

    const outputPins = [
      'output_pin'
    ]

    const controllable = [
      'fan',
      'fan_generic',
      'output_pin'
    ]

    const applyColor = [
      'temperature_fan'
    ]

    const supportedTypes = (filter && filter.length)
      ? filter
      : [...fans, ...outputPins]

    const pins: Array<Fan | OutputPin> = []

    for (const pin in state.printer) {
      const split = pin.split(' ')

      if (supportedTypes.includes(split[0])) {
        const name = (split.length > 1) ? split[1] : pin

        let prettyName = Vue.$filters.startCase(name)
        if (name === 'fan') prettyName = 'Part Fan' // If we know its the part fan.

        const color = (applyColor.includes(split[0]))
          ? Vue.$colorset.next(getKlipperType(pin), pin)
          : undefined

        const type = (split.length) ? split[0] : pin
        const config = getters.getPrinterSettings(pin)

        let output: Fan | OutputPin = {
          ...state.printer[pin],
          config: { ...config },
          name,
          prettyName,
          key: pin,
          color,
          type,
          controllable: (controllable.includes(split[0]))
        }

        if (fans.includes(type)) {
          output = {
            ...output,
            minTemp: (config && config.min_temp) ? config.min_temp : undefined,
            maxTemp: (config && config.max_temp) ? config.max_temp : undefined
          }
        }

        if (outputPins.includes(type)) {
          output = {
            ...output,
            pwm: (config && config.pwm) ? config.pwm : false,
            scale: (config && config.scale) ? config.scale : 1,
            controllable: (config && config.static_value) ? false : (controllable.includes(split[0]))
          }
        }

        pins.push(output)
      }
    }
    return pins
  },

  /**
   * Return available temperature probes / sensors.
   */
  getSensors: (state, getters): Sensor[] => {
    const supportedSensors = [
      'temperature_sensor',
      'temperature_probe'
    ]
    const sensors: Sensor[] = []
    for (const item in state.printer) {
      const split = item.split(' ')

      if (supportedSensors.includes(split[0])) {
        const name = (split.length > 1) ? split[1] : item
        const prettyName = Vue.$filters.startCase(name)
        const color = Vue.$colorset.next(getKlipperType(item), item)
        const type = (split.length) ? split[0] : item
        const config = getters.getPrinterSettings(item)
        const sensor = {
          ...state.printer[item],
          ...config,
          minTemp: (config && config.min_temp) ? config.min_temp : null,
          maxTemp: (config && config.max_temp) ? config.max_temp : null,
          name,
          key: item,
          prettyName,
          color,
          type
        }
        sensors.push(sensor)
      }
    }
    return sensors
  },

  /**
   * Return a list of keys that represent something we may want
   * to chart.
   */
  getChartableSensors: (state) => {
    let sensors: string[] = []
    const keys = [
      'temperature_fan',
      'temperature_probe',
      'temperature_sensor'
    ]

    for (const key of Object.keys(state.printer)) {
      if (keys.some(e => key.startsWith(e))) {
        sensors.push(key)
      }
    }

    if (state.printer.heaters.available_heaters.length > 0) {
      sensors = [...sensors, ...state.printer.heaters.available_heaters]
    }
    return sensors
  },

  /**
   * Return known extruders, giving them a friendly name.
   */
  getExtruders: (state) => {
    const extruders: Extruder[] = []
    Object.keys(state.printer)
      .filter(key => key.startsWith('extruder'))
      .sort()
      .forEach(key => {
        if (key.startsWith('extruder')) {
          if (key === 'extruder') {
            extruders.push({ name: 'Extruder 0', key })
          } else {
            const match = key.match(/\d+$/)
            if (match) extruders.push({ name: 'Extruder ' + match[0], key })
          }
        }
      })
    return extruders
  },

  /**
   * Return a required setting from the printer.config object.
   */
  getPrinterSettings: (state) => (setting: string) => {
    if (
      state.printer &&
      state.printer.configfile &&
      state.printer.configfile.settings
    ) {
      if (setting) return get(state.printer.configfile.settings, setting.toLowerCase(), undefined)
      return state.printer.configfile.settings
    }
    return undefined
  },

  getPrinterConfig: (state) => (config: string) => {
    if (
      state.printer &&
      state.printer.configfile &&
      state.printer.configfile.config
    ) {
      if (config) return get(state.printer.configfile.config, config, undefined)
      return state.printer.configfile.config
    }
    return undefined
  },

  getHasWarnings: (state, getters, rootState) => {
    if (
      (rootState.socket && rootState.socket.open && rootState.socket.ready) &&
      (getters.getPrinterWarnings.length > 0 || getters.getMoonrakerWarnings.length > 0)
    ) {
      return true
    } else {
      return false
    }
  },

  getPrinterWarnings: (state, getters) => {
    const config = getters.getPrinterConfig()
    const warnings = []

    if (config && !('virtual_sdcard' in config)) {
      warnings.push({ message: '[virtual_sdcard] not found in printer configuration.' })
    }

    if (config && !('pause_resume' in config)) {
      warnings.push({ message: '[pause_resume] not found in printer configuration.' })
    }

    if (
      config &&
      !('display' in config) && !('display_status' in config)
    ) {
      warnings.push({ message: '[display_status] is required if you do not have a [display] defined.' })
    }

    if (config && !('gcode_macro CANCEL_PRINT' in config)) {
      warnings.push({ message: 'CANCEL_PRINT macro not found in configuration.' })
    }
    return warnings
  },

  getMoonrakerWarnings: (state, getters, rootState, rootGetters) => {
    return rootGetters['server/getInfo'].failed_components || []
  }
}
