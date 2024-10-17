import Vue from 'vue'
import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { PrinterState, Heater, Fan, Led, OutputPin, Sensor, RunoutSensor, KnownExtruder, MCU, Endstop, Probe, ExtruderStepper, Extruder, ExtruderConfig, ProbeName, Stepper, ScrewsTiltAdjustScrew, ScrewsTiltAdjust, BedScrews, BedSize, GcodeCommands, TimeEstimates } from './types'
import { get } from 'lodash-es'
import getKlipperType from '@/util/get-klipper-type'
import i18n from '@/plugins/i18n'
import type { GcodeHelp } from '../console/types'
import type { ServerInfo } from '../server/types'
import { Globals } from '@/globals'
import isKeyOf from '@/util/is-key-of'

export const getters: GetterTree<PrinterState, RootState> = {

  /**
   * Indicates if klippy is connected or not.
   */
  getKlippyReady: (state, getters, rootState, rootGetters): boolean => {
    // Valid states are;
    // ready, startup, shutdown, error
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo

    return (
      serverInfo.klippy_state === 'ready' &&
      serverInfo.klippy_connected
    )
  },

  getKlippyConnected: (state, getters, rootState, rootGetters): boolean => {
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo

    return serverInfo.klippy_connected
  },

  getKlippyState: (state, getters, rootState, rootGetters): string => {
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo

    return Vue.$filters.capitalize(serverInfo.klippy_state || '')
  },

  getKlippyStateMessage: (state, getters, rootState, rootGetters): string => {
    // If there's absolutely no connection to klipper, then
    // say so.
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo
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
      return state.printer.info.state_message.trim().replace(/\r\n|\r|\n/g, '<br />')
    }
    if (
      state.printer.webhooks.state_message &&
      state.printer.webhooks.state_message !== ''
    ) {
      return state.printer.webhooks.state_message.trim().replace(/\r\n|\r|\n/g, '<br />')
    }
    return 'Unknown'
  },

  getKlippyApp: (state) => {
    const app = state.printer.info.app?.toLowerCase()

    const klippyApp = isKeyOf(app, Globals.SUPPORTED_SERVICES.klipper)
      ? app
      : 'klipper'

    return {
      name: klippyApp,
      ...Globals.SUPPORTED_SERVICES.klipper[klippyApp]
    }
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
    // printing, busy, paused, cancelled, ready, idle, standby
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

  getFileRelativePrintProgress: (state): number => {
    const { gcode_start_byte, gcode_end_byte, path, filename } = state.printer.current_file ?? {}
    const { file_position, progress } = state.printer.virtual_sdcard ?? {}

    const fullFilename = path ? `${path}/${filename}` : filename

    if (gcode_start_byte && gcode_end_byte && file_position && fullFilename === state.printer.print_stats.filename) {
      if (file_position <= gcode_start_byte) return 0
      if (file_position >= gcode_end_byte) return 1

      const currentPosition = file_position - gcode_start_byte
      const endPosition = gcode_end_byte - gcode_start_byte

      if (currentPosition > 0 && endPosition > 0) return currentPosition / endPosition
    }

    return progress || 0
  },

  getFileAbsolutePrintProgress: (state): number => {
    return state.printer.virtual_sdcard?.progress || 0
  },

  getSlicerPrintProgress: (state): number => {
    return state.printer.display_status.progress || 0
  },

  getFilamentPrintProgress: (state) => {
    const { filament_used, filename: statsFilename } = state.printer.print_stats ?? {}
    const { filament_total, path, filename } = state.printer.current_file ?? {}

    const fullFilename = path ? `${path}/${filename}` : filename

    if (filament_used != null && filament_total && fullFilename === statsFilename) {
      return filament_used / filament_total
    }

    return state.printer.virtual_sdcard?.progress || 0
  },

  getPrintProgress: (state, getters, rootState): number => {
    const printProgressCalculation = rootState.config.uiSettings.general.printProgressCalculation

    const printProgressCalculationResults = printProgressCalculation
      .map(type => {
        switch (type) {
          case 'file':
            return getters.getFileRelativePrintProgress

          case 'fileAbsolute':
            return getters.getFileAbsolutePrintProgress

          case 'slicer':
            return getters.getSlicerPrintProgress

          case 'filament':
            return getters.getFilamentPrintProgress

          default:
            return 0
        }
      })
      .filter(result => result > 0)

    const printProgress = printProgressCalculationResults
      .reduce((a, b) => a + b, 0) / printProgressCalculationResults.length || 0

    return printProgress
  },

  getPrintLayers: (state): number => {
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

  getPrintLayer: (state): number => {
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

  getTimeEstimates: (state, getters, rootGetters): TimeEstimates => {
    const progress = getters.getPrintProgress as number
    const fileProgress = getters.getFileRelativePrintProgress as number

    const totalDuration = state.printer.print_stats?.total_duration as number | undefined ?? 0
    const printDuration = state.printer.print_stats?.print_duration as number | undefined ?? 0

    const fileLeft = printDuration > 0 && fileProgress > 0
      ? printDuration / fileProgress - printDuration
      : 0

    const currentFileStatus = state.printer.current_file?.history?.status as string | undefined
    const currentFileTotalDuration = state.printer.current_file?.history?.total_duration as number | undefined

    const actualLeft = currentFileStatus === 'completed' && currentFileTotalDuration != null
      ? currentFileTotalDuration - printDuration
      : 0

    const slicerTotal = state.printer.current_file?.estimated_time as number | undefined

    const slicerLeft = slicerTotal != null && slicerTotal > 0
      ? slicerTotal - printDuration
      : 0

    const printEtaCalculation = rootGetters.config.uiSettings.general.printEtaCalculation

    const printEtaCalculationResults = printEtaCalculation
      .map(type => {
        switch (type) {
          case 'file':
            return (
              actualLeft > 0
                ? actualLeft
                : fileLeft
            )

          case 'slicer':
            return slicerLeft

          default:
            return 0
        }
      })
      .filter(result => result > 0)

    const etaLeft = printEtaCalculationResults
      .reduce((a, b) => a + b, 0) / printEtaCalculationResults.length || 0

    const eta = Date.now() + etaLeft * 1000

    return {
      progress: Math.floor(progress * 100),
      printDuration,
      totalDuration,
      slicerLeft,
      fileLeft,
      actualLeft,
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

  getHasExtruder: (state) => {
    return state.printer.extruder
  },

  getHasMultipleExtruders: (state) => {
    return (
      state.printer.extruder &&
      state.printer.extruder1
    )
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

  getExtruderSteppers: (state, getters): ExtruderStepper[] => {
    const steppers = getters.getSteppers as Stepper[]

    return steppers
      .filter((stepper): stepper is ExtruderStepper => stepper.key.startsWith('extruder_stepper '))
  },

  getSteppers: (state, getters): Stepper[] => {
    const steppers: Stepper[] = []

    const stepperKeys: string[] = state.printer.motion_report.steppers ?? []

    for (const item of stepperKeys) {
      const name = item.startsWith('stepper_')
        ? item.substring(8)
        : item.split(' ', 2).pop() || ''

      const e = state.printer[item]
      const c = getters.getPrinterSettings(item)

      steppers.push({
        name,
        prettyName: Vue.$filters.prettyCase(name),
        key: item,
        enabled: state.printer.stepper_enable?.steppers[item],
        ...e,
        config: { ...c }
      })
    }

    return steppers
  },

  getHasSteppersEnabled: (state, getters): boolean => {
    const steppers = getters.getSteppers as Stepper[]

    return Object.values(steppers)
      .some(stepper => stepper.enabled == null || stepper.enabled)
  },

  /**
   * Given axes, returns a boolean indicating if the axes are homed.
   */
  getHomedAxes: (state) => (axes?: string): boolean => {
    return (
      axes != null &&
      axes.length > 0 &&
      axes.split('')
        .every(char => state.printer.toolhead.homed_axes.includes(char))
    )
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
          prettyName: Vue.$filters.prettyCase(name),
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
          const prettyName = Vue.$filters.prettyCase(name)

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
      'dotstar',
      'pca9533',
      'pca9632'
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
      'output_pin',
      'pwm_tool',
      'pwm_cycle_time'
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
      'output_pin',
      'pwm_tool',
      'pwm_cycle_time'
    ]

    // LEDs...
    const leds = [
      'led',
      'neopixel',
      'dotstar',
      'pca9533',
      'pca9632'
    ]

    // Are they controllable?
    const controllable = [
      'fan',
      'fan_generic',
      'output_pin',
      'pwm_tool',
      'pwm_cycle_time',
      'led',
      'neopixel',
      'dotstar',
      'pca9533',
      'pca9632'
    ]

    // Should we apply a color?
    const applyColor = [
      'temperature_fan'
    ]

    // Should we filter visiblity based on the _ prefix?
    const filterByPrefix = [
      'output_pin',
      'pwm_tool',
      'pwm_cycle_time',
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'led',
      'neopixel',
      'dotstar',
      'pca9533',
      'pca9632'
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
          : Vue.$filters.prettyCase(name)

        const color = (applyColor.includes(type))
          ? Vue.$colorset.next(getKlipperType(pin), pin)
          : undefined

        const config = getters.getPrinterSettings(pin)

        let output: Fan | Led | OutputPin = {
          ...state.printer[pin],
          ...getters.getExtraSensorData(config?.sensor_type?.toLowerCase(), name),
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
            pwm: config?.pwm ?? false,
            scale: config?.scale ?? 1,
            resetValue: config?.value ?? 0,
            controllable: config?.static_value ? false : controllable.includes(type)
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
      'tmc2240',
      'z_thermal_adjust'
    ]
    const supportedDrivers = [
      'tmc2240'
    ]

    const sensors = Object.keys(state.printer)
      .reduce((groups, item) => {
        const [type, nameFromSplit] = item.split(' ', 2)
        const name = nameFromSplit ?? item

        if (supportedSensors.includes(type) && !name.startsWith('_')) {
          const prettyName = supportedDrivers.includes(type)
            ? i18n.t('app.general.label.stepper_driver',
              {
                name:
                  name.startsWith('stepper_')
                    ? name.substring(8).toUpperCase()
                    : Vue.$filters.prettyCase(name)
              })
            : Vue.$filters.prettyCase(name)
          const color = Vue.$colorset.next(getKlipperType(item), item)
          const config = getters.getPrinterSettings(item)

          groups[name] = {
            ...state.printer[item],
            ...getters.getExtraSensorData(config?.sensor_type?.toLowerCase(), name),
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
      'nevermoresensor',
      'sht3x'
    ]

    if (supportedSensors.includes(sensorType)) {
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
      ],
      [
        'tmc2240'
      ]
    ]

    const printerKeys = Object.keys(state.printer)

    const sensors = keyGroups.flatMap(keyGroup => {
      const keyGroupRegExpArray = keyGroup
        .map(x => new RegExp(`^${x}(?! _)`))

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
    const screws: BedScrews[] = []

    for (let index = 1; index <= 99; index++) {
      const key = `screw${index}`
      const coords = config[key]

      if (!coords) {
        break
      }

      const fine = config[`screw${index}_fine_adjust`]
      const name = config[`screw${index}_name`]
      const prettyName = Vue.$filters.prettyCase(name || i18n.t('app.general.label.screw_number', { index: index + 1 }))

      screws.push({
        key,
        name,
        prettyName,
        fine,
        x: coords[0],
        y: coords[1]
      })
    }

    return screws
  },

  getScrewsTiltAdjust: (state, getters) => {
    const config = getters.getPrinterSettings('screws_tilt_adjust')
    const screws: ScrewsTiltAdjustScrew[] = []

    const { results, ...rest } = state.printer.screws_tilt_adjust

    for (let index = 1; index <= 99; index++) {
      const key = `screw${index}`
      const result = results?.[key]

      if (!result) {
        break
      }

      const coords = config[key]
      const name = config[`${key}_name`]
      const prettyName = Vue.$filters.prettyCase(name || i18n.t('app.general.label.screw_number', { index: index + 1 }))
      const [hours, minutes] = result.adjust
        .split(':')
        .map(Number)
      const adjustMinutes = hours * 60 + minutes

      screws.push({
        key,
        name,
        prettyName,
        ...result,
        adjustMinutes,
        x: coords[0],
        y: coords[1]
      })
    }

    return {
      ...rest,
      screws
    } as ScrewsTiltAdjust
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
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo

    return serverInfo.failed_components || []
  },

  getMoonrakerWarnings: (state, getters, rootState, rootGetters) => {
    const serverInfo = rootGetters['server/getInfo'] as ServerInfo

    return serverInfo.warnings || []
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

  getHasRoundBed: (_, getters): boolean => {
    const kinematics = getters.getPrinterSettings('printer.kinematics') || ''

    return [
      'delta',
      'polar',
      'rotary_delta',
      'winch'
    ].includes(kinematics)
  },

  getBedSize: (state): BedSize | undefined => {
    const { axis_minimum, axis_maximum } = state.printer.toolhead

    if (
      axis_minimum.length < 2 ||
      axis_maximum.length < 2
    ) {
      return undefined
    }

    const [minX, minY] = axis_minimum
    const [maxX, maxY] = axis_maximum

    return {
      minX,
      minY,
      maxX,
      maxY
    }
  },

  getAvailableCommands: (state, getters, rootState, rootGetters): GcodeCommands => {
    const availableCommands = state.printer.gcode.commands as GcodeCommands | null

    if (availableCommands) {
      return availableCommands
    }

    const knownCommands = rootGetters['console/getAllKnownCommands'] as GcodeHelp

    return Object.entries(knownCommands)
      .reduce((availableCommands, [key, help]) => {
        availableCommands[key] = { help }

        return availableCommands
      }, {} as GcodeCommands)
  },

  getIsManualProbeActive: (state) => {
    return state.printer.manual_probe?.is_active || false
  },

  getIsBedScrewsAdjustActive: (state) => {
    return state.printer.bed_screws?.is_active || false
  },

  getHasScrewsTiltAdjustResults: (state) => {
    const { error, max_deviation, results } = state.printer.screws_tilt_adjust ?? {}

    return (
      !error &&
      max_deviation == null &&
      results &&
      Object.keys(results).length > 0
    )
  }
}
