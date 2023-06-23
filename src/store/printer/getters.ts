import Vue from 'vue'
import { GetterTree } from 'vuex'
import { RootState } from '../types'
import { PrinterState, Heater, Fan, Led, OutputPin, Sensor, RunoutSensor, KnownExtruder, MCU, Endstop, Probe, ExtruderStepper, Extruder, ExtruderConfig, ProbeName } from './types'
import { get } from 'lodash-es'
import getKlipperType from '@/util/get-klipper-type'

export const getters: GetterTree<PrinterState, RootState> = {

  /**
   * Indicates if klippy is connected or not.
   */
  getklippyReady: (state, getters, rootState, rootGetters): boolean => {
    // Valid states are;
    // ready, startup, shutdown, error
    const serverInfo = rootGetters['server/getInfo']
    const server_klippy_state = serverInfo.klippy_state || ''
    const connected = serverInfo.klippy_connected || false
    if (
      server_klippy_state !== 'ready' ||
      !connected
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
    const state2 = state.printer.print_stats.state // printing, paused, standby, complete, cancelled, error
    // If the idle state says we're printing, but the print_stats say otherwise - then
    // we're probably busy moving the toolhead or doing some other process.
    // Possible values are;
    // printing, busy, paused, ready, idle, standby
    if (state1 && state2) {
      if (
        state2.toLowerCase() === 'paused' ||
        state2.toLowerCase() === 'cancelled'
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

  getPrintProgress: (state) => {
    const { gcode_start_byte, gcode_end_byte, path, filename } = state.printer.current_file ?? {}
    const { file_position } = state.printer.virtual_sdcard ?? {}

    const fullFilename = path ? `${path}/${filename}` : filename

    if (gcode_start_byte && gcode_end_byte && file_position && fullFilename === state.printer.print_stats.filename) {
      if (file_position <= gcode_start_byte) return 0
      if (file_position >= gcode_end_byte) return 1

      const currentPosition = file_position - gcode_start_byte
      const endPosition = gcode_end_byte - gcode_start_byte

      if (currentPosition > 0 && endPosition > 0) return currentPosition / endPosition
    }

    return state.printer.display_status.progress || 0
  },

  getPrintLayers: (state) => {
    const layersFromPrintStats = state.printer.print_stats.info?.total_layer
    if (typeof layersFromPrintStats === 'number') {
      return layersFromPrintStats
    }
    const current_file = state.printer.current_file
    if ('layer_count' in current_file) {
      return current_file.layer_count
    } else if (
      'first_layer_height' in current_file &&
      'layer_height' in current_file &&
      'object_height' in current_file
    ) {
      const lc = Math.ceil((current_file.object_height - current_file.first_layer_height) / current_file.layer_height + 1)
      if (lc > 0) return lc
    }
    return 0
  },

  getPrintLayer: (state) => {
    const layerFromPrintStats = state.printer.print_stats.info?.current_layer
    if (typeof layerFromPrintStats === 'number') {
      return layerFromPrintStats
    }
    const current_file = state.printer.current_file
    const duration = state.printer.print_stats.print_duration || 0
    const pos = state.printer.gcode_move.gcode_position
    if (
      current_file &&
      duration > 0 &&
      'first_layer_height' in current_file &&
      'layer_height' in current_file &&
      pos &&
      pos.length >= 3
    ) {
      const z = state.printer.gcode_move.gcode_position[2]
      const l = Math.ceil((z - current_file.first_layer_height) / current_file.layer_height + 1)
      if (l > 0) return l
    }
    return 0
  },

  getTimeEstimates: (state, getters) => {
    const progress = getters.getPrintProgress
    const endTime = Math.floor(Date.now() / 1000)

    const duration = (
      'print_stats' in state.printer &&
      'print_duration' in state.printer.print_stats
    )
      ? state.printer.print_stats.print_duration
      : 0

    const multiplier = state.printer.gcode_move.speed_factor || 1

    let file = 0
    let fileLeft = 0
    let fileEndTime = 0
    if (progress > 0 && duration > 0) {
      file = duration / progress
      fileLeft = (file - duration) / multiplier
      fileEndTime = endTime + fileLeft
    }

    let actualTotal = 0
    let actualLeft = 0
    let actualEndTime = 0
    if (
      'current_file' in state.printer &&
      'history' in state.printer.current_file &&
      state.printer.current_file.history.status === 'completed'
    ) {
      actualTotal = state.printer.current_file.history.total_duration
      actualLeft = (actualTotal - duration) / multiplier
      actualEndTime = endTime + actualLeft
    }

    let slicer = 0
    let slicerLeft = 0
    let slicerEndTime = 0
    if (
      'current_file' in state.printer &&
      'estimated_time' in state.printer.current_file
    ) {
      slicer = state.printer.current_file.estimated_time
      slicerLeft = (slicer - duration) / multiplier
      slicerEndTime = endTime + slicerLeft
    }

    let eta = fileEndTime
    if (slicerEndTime > 0) eta = slicerEndTime
    if (actualEndTime > 0) eta = actualEndTime

    return {
      progress: (progress * 100).toFixed(),
      duration,
      slicer: slicerLeft,
      file: fileLeft,
      actual: actualLeft,
      eta
    }
  },

  /**
   * Return system stats
   */
  getSystemStats: (state) => {
    return state.printer.system_stats
  },

  /**
   * Return MCU's and their state
   */
  getMcus: (state) => {
    const mcus: MCU[] = []
    Object.keys(state.printer)
      .filter(key => key.startsWith('mcu'))
      .sort()
      .forEach(key => {
        mcus.push({
          name: key,
          ...state.printer[key]
        })
      })
    return mcus
  },

  /**
 * Return known extruders, giving them a friendly name.
 */
  getExtruders: (state) => {
    const extruderCount = Object.keys(state.printer)
      .filter(key => /^extruder\d{0,2}$/.exec(key))
      .length

    return [...Array(extruderCount).keys()]
      .map((index): KnownExtruder => ({
        key: `extruder${index === 0 ? '' : index}`,
        name: extruderCount === 1 ? 'Extruder' : `Extruder ${index}`
      }))
  },

  // Return the current extruder along with its configuration.
  getActiveExtruder: (state, getters) => {
    const name = state.printer.toolhead.extruder || 'extruder'
    return getters.getExtruderByName(name) as Extruder | undefined
  },

  // Returns an extruder by name.
  getExtruderByName: (state, getters) => (name: string) => {
    const e = state.printer[name] || undefined
    const c = getters.getPrinterSettings(name) as ExtruderConfig

    // If we can't find what we need..
    if (!e || !c) return undefined

    // If we have other extruders, they may inherit some properties
    // from the first depending how they're defined.
    const { min_extrude_temp } = name === 'extruder'
      ? c
      : getters.getPrinterSettings('extruder') as ExtruderConfig

    const extruder: Extruder = {
      min_extrude_temp,
      config: { ...c },
      ...e
    }

    return extruder
  },

  getExtruderSteppers: (state, getters) => {
    const extruderSteppers: ExtruderStepper[] = []
    for (const item in state.printer) {
      const [type, name] = item.split(' ', 2)

      if (type === 'extruder_stepper') {
        const e = state.printer[item]
        const c = getters.getPrinterSettings(item)

        extruderSteppers.push({
          name,
          prettyName: Vue.$filters.startCase(name),
          key: item,
          enabled: state.printer.stepper_enable?.steppers[item],
          ...e,
          config: { ...c }
        })
      }
    }
    return extruderSteppers.sort((a, b) => a.name.localeCompare(b.name))
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

  getRunoutSensors: (state): RunoutSensor[] => {
    const supportedSensors = ['filament_switch_sensor', 'filament_motion_sensor']
    const sensors: RunoutSensor[] = []
    for (const item in state.printer) {
      const [type, nameFromSplit] = item.split(' ', 2)

      if (supportedSensors.includes(type)) {
        const name = nameFromSplit ?? item
        const sensor = get(state.printer, item, undefined)
        sensors.push({
          name,
          ...sensor
        })
      }
    }
    return sensors
  },

  getEndstops: (state) => {
    const endstops: Endstop[] = []
    Object.keys(state.printer.endstops)
      .sort()
      .forEach(key => {
        endstops.push({
          name: key,
          state: state.printer.endstops[key]
        })
      })
    return endstops
  },

  getProbe: (state, getters): Probe | undefined => {
    const probe = state.printer.probe as Probe | undefined

    if (probe && !probe.name) {
      const probeNames = [
        'bltouch',
        'smart_effector',
        'probe'
      ] as ProbeName[]

      for (const name of probeNames) {
        const probeSettings = getters.getPrinterSettings(name)

        if (probeSettings?.z_offset !== undefined) {
          const probeWithName: Probe = {
            ...probe,
            name
          }

          return probeWithName
        }
      }
    }

    return probe
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

          const [type, nameFromSplit] = e.split(' ', 2)
          const name = nameFromSplit && keys.includes(type)
            ? nameFromSplit
            : e

          const color = Vue.$colorset.next(getKlipperType(e), e)
          const prettyName = Vue.$filters.startCase(name)

          r.push({
            ...heater,
            name,
            color,
            prettyName,
            key: e,
            minTemp: config?.min_temp,
            maxTemp: config?.max_temp
          })
        }
      })

      return r.sort((a, b) => a.name.localeCompare(b.name))
    }
    return []
  },

  getAllLeds: (_, getters) => {
    return getters.getOutputs([
      'led',
      'neopixel',
      'dotstar'
    ])
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
    return outputs.sort((output: OutputPin) => output.pwm ? 1 : -1)
  },

  getPinByName: (state, getters) => (name: string) => {
    const pins = getters.getPins as OutputPin[]

    return pins.find(pin => pin.name === name)
  },

  /**
  * Return available fans and output pins
  */
  getOutputs: (state, getters) => (filter?: string[]): Array<Fan | Led | OutputPin> => {
    // Fans..
    const fans = [
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'fan'
    ]

    // Generic pins...
    const outputPins = [
      'output_pin'
    ]

    // LEDs...
    const leds = [
      'led',
      'neopixel',
      'dotstar'
    ]

    // Are they controllable?
    const controllable = [
      'fan',
      'fan_generic',
      'output_pin',
      'led',
      'neopixel',
      'dotstar'
    ]

    // Should we apply a color?
    const applyColor = [
      'temperature_fan'
    ]

    // Should we filter visiblity based on the _ prefix?
    const filterByPrefix = [
      'output_pin',
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'led',
      'neopixel',
      'dotstar'
    ]

    const supportedTypes = (filter && filter.length)
      ? filter
      : [...fans, ...outputPins, ...leds]

    const pins: Array<Fan | Led | OutputPin> = []

    for (const pin in state.printer) {
      const [type, nameFromSplit] = pin.split(' ', 2)
      const name = nameFromSplit ?? pin

      if (
        supportedTypes.includes(type) &&
        (!filterByPrefix.includes(type) || !name.startsWith('_'))
      ) {
        const prettyName = name === 'fan'
          ? 'Part Fan' // If we know its the part fan.
          : Vue.$filters.startCase(name)

        const color = (applyColor.includes(type))
          ? Vue.$colorset.next(getKlipperType(pin), pin)
          : undefined

        const config = getters.getPrinterSettings(pin)

        let output: Fan | Led | OutputPin = {
          ...state.printer[pin],
          ...getters.getExtraSensorData(config?.sensor_type, name),
          config: { ...config },
          name,
          prettyName,
          key: pin,
          color,
          type,
          controllable: (controllable.includes(type))
        }

        if (fans.includes(type)) {
          output = {
            ...output,
            minTemp: config?.min_temp,
            maxTemp: config?.max_temp
          }
        }

        if (outputPins.includes(type)) {
          output = {
            ...output,
            pwm: (config && config.pwm) ? config.pwm : false,
            scale: (config && config.scale) ? config.scale : 1,
            controllable: (config && config.static_value) ? false : (controllable.includes(type))
          }
        }

        pins.push(output)
      }
    }
    return pins
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  },

  /**
   * Return available temperature probes / sensors.
   */
  getSensors: (state, getters): Sensor[] => {
    const supportedSensors = [
      'temperature_sensor',
      'temperature_probe',
      'z_thermal_adjust'
    ]

    const sensors = Object.keys(state.printer)
      .reduce((groups, item) => {
        const [type, nameFromSplit] = item.split(' ', 2)

        if (supportedSensors.includes(type)) {
          const name = nameFromSplit ?? item
          const prettyName = Vue.$filters.startCase(name)
          const color = Vue.$colorset.next(getKlipperType(item), item)
          const config = getters.getPrinterSettings(item)

          groups[name] = {
            ...state.printer[item],
            ...getters.getExtraSensorData(config?.sensor_type, name),
            config: { ...config },
            minTemp: config?.min_temp ?? null,
            maxTemp: config?.max_temp ?? null,
            name,
            key: item,
            prettyName,
            color,
            type
          }
        }

        return groups
      }, {} as Record<string, Sensor>)

    return Object.values(sensors)
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  },

  getExtraSensorData: (state) => (sensorType: string, name: string) => {
    const supportedSensors = [
      'aht10',
      'bme280',
      'htu21d',
      'nevermoresensor'
    ]

    if (supportedSensors.includes(sensorType?.toLowerCase())) {
      const sensor = state.printer[`${sensorType} ${name}`]

      if (sensor) {
        const { pressure, humidity, gas } = sensor

        return {
          pressure,
          humidity,
          gas
        }
      }
    }
  },

  /**
   * Return a list of keys that represent something we may want
   * to chart.
   */
  getChartableSensors: (state) => {
    const keyGroups = [
      [
        'temperature_fan'
      ],
      [
        'temperature_probe',
        'z_thermal_adjust',
        'temperature_sensor'
      ]
    ]

    const filterByPrefix = [
      'temperature_fan'
    ]

    const printerKeys = Object.keys(state.printer)

    const sensors = keyGroups.flatMap(keyGroup => {
      const keyGroupRegExpArray = keyGroup
        .map(x => new RegExp(
          filterByPrefix.includes(x)
            ? `^${x}(?! _)`
            : `^${x}`)
        )

      return printerKeys
        .filter(key => keyGroupRegExpArray.some(x => x.test(key)))
        .sort((a, b) => a.localeCompare(b))
    })

    const heaters = [...state.printer.heaters.available_heaters as string[]]
      .sort((a, b) => a.localeCompare(b))

    return [
      ...heaters,
      ...sensors
    ]
  },

  getBedScrews: (_, getters) => {
    const config = getters.getPrinterSettings('bed_screws')
    const screws = []

    for (let index = 1; index <= 99; index++) {
      const adjust = config[`screw${index}`]

      if (!adjust) {
        break
      }

      screws.push({
        adjust,
        fine: config[`screw${index}_fine_adjust`],
        name: config[`screw${index}_name`]
      })
    }

    return screws
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
      (getters.getPrinterWarnings.length > 0 || getters.getKlipperWarnings.length > 0 ||
        getters.getMoonrakerFailedComponents.length > 0 || getters.getMoonrakerWarnings.length > 0)
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

  getKlipperWarnings: (state) => {
    return state.printer.configfile?.warnings || []
  },

  getMoonrakerFailedComponents: (state, getters, rootState, rootGetters) => {
    return rootGetters['server/getInfo'].failed_components || []
  },

  getMoonrakerWarnings: (state, getters, rootState, rootGetters) => {
    return rootGetters['server/getInfo'].warnings || []
  },

  getSaveConfigPending: (state): boolean => {
    const saveConfigPending = state.printer.configfile?.save_config_pending as boolean | undefined

    return saveConfigPending || false
  },

  getSaveConfigPendingItems: (state): Record<string, Record<string, string>> => {
    const saveConfigPendingItems = state.printer.configfile?.save_config_pending_items as Record<string, Record<string, string>> | undefined

    return saveConfigPendingItems || {}
  },

  getHasHomingOverride: (state, getters) => {
    const config = getters.getPrinterConfig()
    if (config && ('homing_override' in config)) {
      return true
    } else {
      return false
    }
  },

  getIsManualProbeActive: (state) => {
    return state.printer.manual_probe?.is_active || false
  },

  getIsBedScrewsAdjustActive: (state) => {
    return state.printer.bed_screws?.is_active || false
  }
}
