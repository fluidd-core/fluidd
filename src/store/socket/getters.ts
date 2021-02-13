import Vue from 'vue'
import { GetterTree } from 'vuex'
import { Heater, Fan, OutputPin, SocketState, TimeEstimates, Sensor, RunoutSensor, BedMesh, Endstops } from './types'
import { Thumbnail } from '@/store/files/types'
import { RootState } from '../types'
import { get, isFinite } from 'lodash-es'
import { getThumb, getKlipperType } from '../helpers'

export const getters: GetterTree<SocketState, RootState> = {
  /**
   * Indicates if our socket is connected / open.
   */
  getConnectionState: (state): boolean => {
    return state.open
  },

  /**
   * Indicates if our socket is attempting to connect still..
   */
  getConnectingState: (state): boolean => {
    return state.connecting
  },

  /**
   * Indicates if klippy is connected or not.
   */
  getKlippyConnected: (state): boolean => {
    // Valid states are;
    // ready, startup, shutdown, error
    if (
      state.printer.info.state !== 'ready' ||
      state.printer.webhooks.state !== 'ready'
      // state.printer.info.state === 'error' ||
      // state.printer.info.state === 'shutdown' ||
      // state.printer.webhooks.state === 'error' ||
      // state.printer.webhooks.state === 'shutdown'
    ) {
      return false
    }
    return true
  },

  getKlippyState: (state): string => {
    const state1 = state.printer.webhooks.state || ''
    const state2 = state.printer.info.state || ''

    if (state1 === state2) {
      return Vue.$filters.capitalize(state1)
    }
    if (state1 !== 'ready') {
      return Vue.$filters.capitalize(state1)
    }
    if (state2 !== 'ready') {
      return Vue.$filters.capitalize(state2)
    }
    return state1
  },

  getKlippyStateMessage: (state): string => {
    // If an external source fires an estop, or the client
    // is refreshed while klipper is down - the webhook data maybe invalid
    // but the printer info should be good.
    let message = ''
    if (
      state.printer.webhooks.state_message &&
      state.printer.webhooks.state_message !== ''
    ) {
      message = state.printer.webhooks.state_message
    } else {
      if (state.printer.info.state_message) {
        message = state.printer.info.state_message
      }
    }
    return message.trim().replace(/(?:\r\n|\r|\n)/g, '<br />')
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
        return state2
      }
      if (
        state1.toLowerCase() === 'printing' &&
        state2.toLowerCase() !== 'printing'
      ) {
        // The printers idle_timeout changes to printing when it's busy applying
        // some change - but not necessarily printing anything. This state hopefully
        // helps aleviate that confusion.
        return 'Busy'
      }
      return state1
    } else {
      return 'Loading'
    }
  },

  getPrintImage: (state) => {
    let thumb: Thumbnail | undefined
    if (state.printer.current_file) {
      thumb = getThumb(state.printer.current_file)
    }
    return thumb
  },

  /**
   * Returns an object representing the time estimates of a current print.
   */
  getTimeEstimates: (state) => (type: 'slicer' | 'file' | 'filament' | 'totals'): TimeEstimates => {
    let progress = (
      !state.printer.virtual_sdcard.progress ||
      isNaN(+state.printer.virtual_sdcard.progress) ||
      !isFinite(+state.printer.virtual_sdcard.progress)
    )
      ? 0
      : state.printer.display_status.progress

    const duration = (
      !state.printer.print_stats.print_duration ||
      isNaN(+state.printer.print_stats.print_duration) ||
      !isFinite(+state.printer.print_stats.print_duration)
    )
      ? 0
      : state.printer.print_stats.print_duration

    const usedFilament = (
      !state.printer.print_stats.filament_used ||
      isNaN(+state.printer.print_stats.filament_used) ||
      !isFinite(+state.printer.print_stats.filament_used)
    )
      ? 0
      : state.printer.print_stats.filament_used

    const estimatedFilament = (
      !state.printer.current_file.filament_total ||
      isNaN(+state.printer.current_file.filament_total) ||
      !isFinite(+state.printer.current_file.filament_total)
    )
      ? 0
      : state.printer.current_file.filament_total

    let timeLeft = 0
    let totalDuration = 0

    switch (type) {
      case 'slicer': {
        progress = (
          !state.printer.display_status.progress ||
          isNaN(+state.printer.display_status.progress) ||
          !isFinite(+state.printer.display_status.progress)
        )
          ? 0
          : state.printer.display_status.progress

        totalDuration = (state.printer.current_file.estimated_time > 0) ? state.printer.current_file.estimated_time : duration
        timeLeft = totalDuration - duration
        break
      }
      case 'filament': {
        totalDuration = duration / (usedFilament / estimatedFilament)
        timeLeft = totalDuration - duration
        break
      }
      case 'file': {
        totalDuration = duration / (progress)
        timeLeft = totalDuration - duration
        break
      }
      case 'totals': { // totals only.
        totalDuration = 0
        timeLeft = 0
        break
      }
      default: { // totals only.
        totalDuration = 0
        timeLeft = 0
      }
    }

    totalDuration = (
      isNaN(+totalDuration) ||
      !isFinite(+totalDuration)
    )
      ? 0
      : totalDuration

    timeLeft = (
      isNaN(+timeLeft) ||
      !isFinite(+timeLeft)
    )
      ? 0
      : timeLeft

    const o = {
      type,
      progress: (progress * 100).toFixed(),
      timeLeft: Vue.$filters.formatCounterTime(timeLeft),
      duration: Vue.$filters.formatCounterTime(duration),
      totalDuration: Vue.$filters.formatCounterTime(totalDuration) // estimated total duration
    }
    return o
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

  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state, getters) => {
    return getters.getPrinterSettings('bed_mesh') !== undefined
  },

  /**
   * Returns all available bed meshes, including those only in memory / currently loaded.
   */
  getBedMeshes: (state, getters): BedMesh[] => {
    const meshes: BedMesh[] = []
    const currentProfile = state.printer.bed_mesh.profile_name || ''
    const config = getters.getPrinterConfig()
    if (state.printer.bed_mesh && currentProfile.length > 0) {
      meshes.push({
        ...state.printer.bed_mesh,
        active: true
      })
    }
    if (config) {
      const meshSettings = Object.keys(config).filter(key => key.startsWith('bed_mesh'))
      for (const key of meshSettings) {
        if (key === 'bed_mesh') continue // The mesh configuration.
        const profile_name = key.split(' ')[1]
        if (
          profile_name !== currentProfile
        ) {
          const profile: BedMesh = {
            profile_name,
            active: false
          }
          meshes.push(profile)
        }
      }
    }
    return meshes.sort((a: BedMesh, b: BedMesh) => {
      const name1 = a.profile_name.toLowerCase()
      const name2 = b.profile_name.toLowerCase()
      if (a.profile_name === 'default' || b.profile_name === 'default') return 1
      return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
    })
  },

  getEndstops: (state): Endstops => {
    if (
      state.endstops
    ) {
      const sorted: Endstops = {}
      Object.keys(state.endstops).sort().forEach((key) => {
        sorted[key] = state.endstops[key]
      })
      return sorted
    }
    return {}
  },

  /**
   * Returns available heater names
   */
  // getHeaterNames: (state): string[] => {
  //   return state.printer.heaters.available_heaters || []
  // },

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
   * Return macros that are visible on the dashboard.
   */
  getMacros: (state) => {
    return state.macros
  },

  getVisibleMacros: (state) => {
    return (state.macros.length)
      ? state.macros.filter(macro => macro.visible)
      : []
  },

  getChartData: (state) => {
    return state.chart
  },

  getConsoleEntries: (state, getters, rootState) => {
    const hideTempWaits = (rootState && rootState.config)
      ? rootState.config.fileConfig.general.hideTempWaits
      : true

    const regex = /^(b|t\d+):\d+\.\d+ \/\d+\.+\d+/i

    return (hideTempWaits)
      ? state.console.filter(entry => !regex.test(entry.message))
      : state.console
  },

  getAvailableCalibrationCommands: (state) => {
    return Object.keys(state.availableCommands)
      .filter(key => key.endsWith('CALIBRATE'))
      .reduce((o, key) => {
        return {
          ...o,
          [key]: state.availableCommands[key]
        }
      }, {})
  },

  getAllGcodeCommands: (state) => {
    const commands = state.availableCommands
    const additional = [
      'TESTZ',
      'ABORT',
      'ACCEPT',
      'ADJUSTED',
      'GET_POSITION'
    ]
    additional.forEach(command => {
      if (command in commands !== true) {
        commands[command] = ''
      }
    })

    return commands
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
      if (setting) return get(state.printer.configfile.settings, setting, undefined)
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

  getHasWarnings: (state, getters) => {
    if (
      (state.open && state.ready) &&
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

  getMoonrakerWarnings: (state) => {
    return state.failed_plugins || []
  }
}
