import Vue from 'vue'
import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { PrinterState, Heater, Fan, Led, OutputPin, Sensor, RunoutSensor, KnownExtruder, MCU, Endstop, ExtruderStepper, Extruder, Stepper, ScrewsTiltAdjustScrew, ScrewsTiltAdjust, BedScrews, BedSize, GcodeCommands, TimeEstimates, KlippyApp, ExcludeObjectPart, KlipperPrinterConfig, BeaconModel, BedScrewsScrew, ExtruderKey, Probe } from './types'
import getKlipperType from '@/util/get-klipper-type'
import i18n from '@/plugins/i18n'
import type { GcodeHelp } from '../console/types'
import { Globals } from '@/globals'
import isKeyOf from '@/util/is-key-of'
import getFilePaths from '@/util/get-file-paths'
import type { AppFileWithMeta } from '../files/types'

export const getters = {

  /**
   * Indicates if klippy is connected or not.
   */
  getKlippyReady: (state, getters, rootState): boolean => {
    // Valid states are;
    // ready, startup, shutdown, error
    const serverInfo = rootState.server.info

    return (
      serverInfo.klippy_state === 'ready' &&
      serverInfo.klippy_connected
    )
  },

  getKlippyConnected: (state, getters, rootState): boolean => {
    const serverInfo = rootState.server.info

    return serverInfo.klippy_connected
  },

  getKlippyState: (state, getters, rootState): string => {
    const serverInfo = rootState.server.info

    return Vue.$filters.prettyCase(serverInfo.klippy_state || '')
  },

  getKlippyStateMessage: (state, getters, rootState): string => {
    // If there's absolutely no connection to klipper, then
    // say so.
    const serverInfo = rootState.server.info

    if (serverInfo.klippy_connected === false) {
      return 'Klippy not connected.'
    }

    // If an external source fires an estop, or the client
    // is refreshed while klipper is down - the webhook data maybe invalid
    // but the printer info should be good.
    if (state.info?.state_message) {
      return state.info.state_message.trim().replace(/\r\n|\r|\n/g, '<br />')
    }
    if (state.printer.webhooks.state_message) {
      return state.printer.webhooks.state_message.trim().replace(/\r\n|\r|\n/g, '<br />')
    }
    return 'Unknown'
  },

  getKlippyApp: (state): KlippyApp => {
    const app = state.info?.app?.toLowerCase()

    const name = app && isKeyOf(app, Globals.SUPPORTED_SERVICES.KLIPPER)
      ? app
      : 'klipper'

    return {
      name,
      isKalico: name === 'kalico',
      isKalicoOrDangerKlipper: name === 'kalico' || name === 'danger-klipper',
      ...Globals.SUPPORTED_SERVICES.KLIPPER[name]
    }
  },

  getPrinterFile: (state, getters, rootState, rootGetters) => {
    const printerFilename = state.printer.print_stats?.filename

    if (printerFilename) {
      const { rootPath, filename } = getFilePaths(printerFilename, 'gcodes')

      const printerFile: AppFileWithMeta | undefined = rootGetters['files/getFile'](rootPath, filename)

      return printerFile
    }
  },

  /**
   * Returns a string value indicating the state of the printer.
   */
  getPrinterState: (state) => {
    const state1 = state.printer.idle_timeout.state // printing, ready, idle
    const state2 = state.printer.print_stats?.state // printing, paused, standby, complete, cancelled, error
    // If the idle state says we're printing, but the print_stats say otherwise - then
    // we're probably busy moving the toolhead or doing some other process.
    // Possible values are;
    // printing, busy, paused, cancelled, ready, idle, standby
    if (state1 && state2) {
      if (
        state2 === 'paused' ||
        state2 === 'cancelled'
      ) {
        return state2
      }

      if (
        state1 === 'Printing' &&
        state2 !== 'printing'
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

  getFileRelativePrintProgress: (state, getters): number => {
    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    const { gcode_start_byte, gcode_end_byte } = printerFile ?? {}
    const { file_position, progress } = state.printer.virtual_sdcard ?? {}

    if (
      gcode_start_byte != null &&
      gcode_end_byte != null &&
      file_position != null
    ) {
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
    return state.printer.display_status?.progress || 0
  },

  getFilamentPrintProgress: (state, getters) => {
    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    const { filament_used } = state.printer.print_stats ?? {}
    const { filament_total } = printerFile ?? {}

    if (
      filament_used != null &&
      filament_total != null
    ) {
      return filament_used / filament_total
    }

    return state.printer.virtual_sdcard?.progress || 0
  },

  getPrintProgress: (state, getters, rootState): number => {
    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    if (printerFile?.history?.status === 'completed') {
      return 1
    }

    const printProgressCalculation = rootState.config.uiSettings.general.printProgressCalculation

    const printProgressCalculationResults = printProgressCalculation
      .map((type): number => {
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

  getPrintLayers: (state, getters): number => {
    const layersFromPrintStats = state.printer.print_stats?.info?.total_layer

    if (typeof layersFromPrintStats === 'number') {
      return layersFromPrintStats
    }

    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    const { layer_count, first_layer_height, layer_height, object_height } = printerFile ?? {}

    if (layer_count != null) {
      return layer_count
    } else if (
      first_layer_height != null &&
      layer_height != null &&
      object_height != null
    ) {
      const lc = Math.ceil((object_height - first_layer_height) / layer_height + 1)

      if (lc > 0) return lc
    }

    return 0
  },

  getPrintLayer: (state, getters): number => {
    const layerFromPrintStats = state.printer.print_stats?.info?.current_layer

    if (typeof layerFromPrintStats === 'number') {
      return layerFromPrintStats
    }

    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    const { first_layer_height, layer_height } = printerFile ?? {}
    const duration = state.printer.print_stats?.print_duration ?? 0
    const pos = state.printer.gcode_move.gcode_position

    if (
      duration > 0 &&
      first_layer_height != null &&
      layer_height != null &&
      layer_height > 0 &&
      pos &&
      pos.length >= 3
    ) {
      const z = pos[2]
      const l = Math.ceil((z - first_layer_height) / layer_height + 1)

      if (l > 0) return l
    }
    return 0
  },

  getTimeEstimates: (state, getters, rootState): TimeEstimates => {
    const progress: number = getters.getPrintProgress
    const fileProgress: number = getters.getFileRelativePrintProgress

    const totalDuration = state.printer.print_stats?.total_duration ?? 0
    const printDuration = state.printer.print_stats?.print_duration ?? 0

    const fileLeft = printDuration > 0 && fileProgress > 0
      ? printDuration / fileProgress - printDuration
      : 0

    const printerFile: AppFileWithMeta | undefined = getters.getPrinterFile

    const { history, estimated_time } = printerFile ?? {}

    const currentFileStatus = history?.status
    const currentFileTotalDuration = history?.total_duration ?? 0

    const actualLeft = currentFileStatus === 'completed' && currentFileTotalDuration > 0
      ? currentFileTotalDuration - printDuration
      : 0

    const slicerLeft = estimated_time != null && estimated_time > 0
      ? estimated_time - printDuration
      : 0

    const printEtaCalculation = rootState.config.uiSettings.general.printEtaCalculation

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
   * Return MCU's and their state
   */
  getMcus: (state) => {
    const mcus: MCU[] = []

    const mcuKeys = Object.keys(state.printer)
      .filter(key => key === 'mcu' || key.startsWith('mcu '))
      .sort()

    for (const key of mcuKeys) {
      const config = state.printer.configfile.settings[key.toLowerCase()]

      mcus.push({
        name: key,
        prettyName: Vue.$filters.prettyCase(key),
        ...state.printer[key],
        config,
      })
    }

    return mcus
  },

  getHasExtruder: (state) => {
    return state.printer.extruder != null
  },

  getHasMultipleExtruders: (state) => {
    return (
      state.printer.extruder != null &&
      state.printer.extruder1 != null
    )
  },

  /**
 * Return known extruders, giving them a friendly name.
 */
  getExtruders: (state): KnownExtruder[] => {
    const extruderKeys = Object.keys(state.printer)
      .filter((key): key is ExtruderKey => /^extruder\d{0,2}$/.test(key))
      .sort((a, b) => +a.substring(8) - +b.substring(8))

    return extruderKeys
      .map(key => ({
        key,
        name: Vue.$filters.prettyCase(key),
      }))
  },

  // Return the current extruder along with its configuration.
  getActiveExtruder: (state, getters) => {
    const name = state.printer.toolhead.extruder || 'extruder'

    const extruder: Extruder | undefined = getters.getExtruderByName(name)

    return extruder
  },

  // Returns an extruder by name.
  getExtruderByName: (state) => (name: ExtruderKey) => {
    const e = state.printer[name]
    const c = state.printer.configfile.settings[name.toLowerCase()]

    // If we can't find what we need..
    if (!e || !c) return undefined

    // If we have other extruders, they may inherit some properties
    // from the first depending how they're defined.
    const min_extrude_temp = (
      c.min_extrude_temp ??
      state.printer.configfile.settings.extruder?.min_extrude_temp ??
      170
    )

    const extruder: Extruder = {
      min_extrude_temp,
      config: { ...c },
      ...e
    }

    return extruder
  },

  getExtruderSteppers: (state, getters): ExtruderStepper[] => {
    const steppers: Stepper[] = getters.getSteppers

    return steppers
      .filter((stepper): stepper is ExtruderStepper => stepper.key.startsWith('extruder_stepper '))
  },

  getSteppers: (state): Stepper[] => {
    const steppers: Stepper[] = []

    const stepperKeys = state.printer.motion_report?.steppers ?? []

    for (const item of stepperKeys) {
      const name = item.startsWith('stepper_')
        ? item.substring(8)
        : item.split(' ', 2).pop() || ''

      const e = state.printer[item]
      const config = state.printer.configfile.settings[item.toLowerCase()]

      steppers.push({
        name,
        prettyName: Vue.$filters.prettyCase(name),
        key: item,
        enabled: state.printer.stepper_enable?.steppers[item],
        ...e,
        config
      })
    }

    return steppers
  },

  getHasSteppersEnabled: (state, getters): boolean => {
    const steppers: Stepper[] = getters.getSteppers

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
    const supportedSensors = [
      'filament_switch_sensor',
      'filament_motion_sensor'
    ] as const

    const sensors: RunoutSensor[] = []

    for (const item in state.printer) {
      const [type, nameFromSplit] = item.split(' ', 2)

      if (supportedSensors.includes(type)) {
        const name = nameFromSplit ?? item

        sensors.push({
          ...state.printer[item],
          name,
          prettyName: Vue.$filters.prettyCase(name),
        })
      }
    }
    return sensors
  },

  getEndstops: (state): Endstop[] => {
    const endstops = state.printer.query_endstops?.last_query

    if (endstops == null) {
      return []
    }

    return Object.keys(endstops)
      .sort()
      .map(name => ({
        name,
        prettyName: i18n.t('app.endstop.label.endstop', { name: name.toUpperCase() }).toString(),
        state: endstops[name]
      }))
  },

  getProbe: (state): Probe | undefined => {
    const probe = state.printer.probe

    if (probe == null) {
      return undefined
    }

    const probeNames = [
      'bltouch',
      'smart_effector',
      'probe'
    ] as const

    const name = probe.name || probeNames.find(name => {
      const probeSettings = state.printer.configfile.settings[name]

      return probeSettings?.z_offset !== undefined
    }) || 'Probe'

    return {
      ...probe,
      name,
      prettyName: Vue.$filters.prettyCase(name)
    }
  },

  /**
   * Return available heaters
   */
  getHeaters: (state): Heater[] => {
    const heaters: Heater[] = []

    const heaterKeys = state.printer.heaters?.available_heaters ?? []

    for (const key of heaterKeys) {
      const heater = state.printer[key]

      if (heater && Object.keys(heater).length > 0) {
        const config = state.printer.configfile.settings[key.toLowerCase()]

        // Some heater items may have a prefix determining type.
        // Check for these and split as necessary.
        const prefixedTypes = [
          'heater_generic'
        ]

        const [type, nameFromSplit] = key.split(' ', 2)
        const name = nameFromSplit && prefixedTypes.includes(type)
          ? nameFromSplit
          : key

        const color = Vue.$colorset.next(getKlipperType(key), key)
        const prettyName = Vue.$filters.prettyCase(name)

        heaters.push({
          ...heater,
          name,
          type,
          color,
          prettyName,
          key,
          minTemp: config?.min_temp ?? 0,
          maxTemp: config?.max_temp ?? 500,
          config
        })
      }
    }

    return heaters
      .sort((a, b) => a.name.localeCompare(b.name))
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
    const pins: OutputPin[] = getters.getPins

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
      'pca9632',
      'nevermore'
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

        const config = state.printer.configfile.settings[pin.toLowerCase()]

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
    ] as const
    const supportedDrivers = [
      'tmc2240'
    ] as const

    const sensors = Object.keys(state.printer)
      .reduce<Record<string, Sensor>>((groups, item) => {
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
              }).toString()
            : Vue.$filters.prettyCase(name)
          const color = Vue.$colorset.next(getKlipperType(item), item)
          const config = state.printer.configfile.settings[item.toLowerCase()]

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
      }, {})

    return Object.values(sensors)
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  },

  getExtraSensorData: (state) => (sensorType: string, name: string) => {
    const supportedSensors = {
      aht10: 'aht10',
      bme280: 'bme280',
      htu21d: 'htu21d',
      sht21: 'htu21d',
      sht3x: 'sht3x',
      si7013: 'htu21d',
      si7020: 'htu21d',
      si7021: 'htu21d',
    } as const

    if (isKeyOf(sensorType, supportedSensors)) {
      const sensor = state.printer[`${supportedSensors[sensorType]} ${name}`]

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

    const heaters: string[] = [...state.printer.heaters?.available_heaters ?? []]
      .sort((a, b) => a.localeCompare(b))

    return [
      ...heaters,
      ...sensors
    ]
  },

  getBedScrews: (state): BedScrews => {
    const config = state.printer.configfile.settings.bed_screws
    const screws: BedScrewsScrew[] = []

    if (config) {
      for (let index = 1; index <= 99; index++) {
        const key = `screw${index}` as const
        const coords = config[key]

        if (!coords) {
          break
        }

        const name = config[`screw${index}_name`] ?? ''
        const prettyName = name
          ? Vue.$filters.prettyCase(name)
          : i18n.t('app.general.label.screw_number', { index: index + 1 }).toString()

        screws.push({
          key,
          name,
          prettyName,
          x: coords[0],
          y: coords[1]
        })
      }
    }

    return {
      ...state.printer.bed_screws,
      screws
    }
  },

  getScrewsTiltAdjust: (state): ScrewsTiltAdjust => {
    const config = state.printer.configfile.settings.screws_tilt_adjust
    const screws: ScrewsTiltAdjustScrew[] = []

    const { results, ...rest } = state.printer.screws_tilt_adjust ?? {}

    if (config) {
      for (let index = 1; index <= 99; index++) {
        const key = `screw${index}` as const
        const result = results?.[key]

        if (!result) {
          break
        }

        const coords = config[key] ?? [0, 0]
        const name = config[`${key}_name`] ?? ''
        const prettyName = name
          ? Vue.$filters.prettyCase(name)
          : i18n.t('app.general.label.screw_number', { index: index + 1 }).toString()
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
    }

    return {
      ...rest,
      screws
    }
  },

  getPrinterSettings: (state) => {
    return state.printer.configfile.settings
  },

  getPrinterConfig: (state) => {
    return state.printer.configfile.config
  },

  getHasWarnings: (state, getters, rootState) => {
    return (
      rootState.socket &&
      rootState.socket.open &&
      rootState.socket.ready &&
      (
        getters.getPrinterWarnings.length > 0 ||
        getters.getKlipperWarnings.length > 0 ||
        getters.getMoonrakerFailedComponents.length > 0 ||
        getters.getMoonrakerWarnings.length > 0
      )
    )
  },

  getPrinterWarnings: (state) => {
    const config = state.printer.configfile.config
    const warnings: string[] = []

    if (Object.keys(config).length > 0) {
      if (!('virtual_sdcard' in config)) {
        warnings.push('[virtual_sdcard] not found in printer configuration.')
      }

      if (!('pause_resume' in config)) {
        warnings.push('[pause_resume] not found in printer configuration.')
      }

      if (
        !('display' in config) &&
        !('display_status' in config)
      ) {
        warnings.push('[display_status] is required if you do not have a [display] defined.')
      }

      if (!('gcode_macro CANCEL_PRINT' in config)) {
        warnings.push('CANCEL_PRINT macro not found in configuration.')
      }
    }

    return warnings
  },

  getKlipperWarnings: (state) => {
    return state.printer.configfile?.warnings || []
  },

  getMoonrakerFailedComponents: (state, getters, rootState) => {
    const serverInfo = rootState.server.info

    return serverInfo.failed_components || []
  },

  getMoonrakerWarnings: (state, getters, rootState) => {
    const serverInfo = rootState.server.info

    return serverInfo.warnings || []
  },

  getSaveConfigPending: (state): boolean => {
    return state.printer.configfile?.save_config_pending || false
  },

  getSaveConfigPendingItems: (state): KlipperPrinterConfig => {
    return state.printer.configfile?.save_config_pending_items || {}
  },

  getHasRoundBed: (state): boolean => {
    const kinematics = state.printer.configfile.settings.printer?.kinematics ?? ''

    return [
      'delta',
      'polar',
      'rotary_delta',
      'winch'
    ].includes(kinematics)
  },

  getBedSize: (state): BedSize => {
    const { axis_minimum, axis_maximum } = state.printer.toolhead

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
    const availableCommands = state.printer.gcode?.commands

    if (availableCommands) {
      return availableCommands
    }

    const knownCommands: GcodeHelp = rootGetters['console/getAllKnownCommands']

    return Object.entries(knownCommands)
      .reduce<GcodeCommands>((availableCommands, [key, help]) => {
        availableCommands[key] = { help }

        return availableCommands
      }, {})
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
      results != null &&
      Object.keys(results).length > 0
    )
  },

  getSupportsBeacon: (state) => {
    return 'beacon' in state.printer.configfile.settings
  },

  getBeaconModels: (state) => {
    const beacon = state.printer.beacon

    if (beacon == null) {
      return []
    }

    const models: BeaconModel[] = Object.keys(state.printer.configfile.settings)
      .filter(key => key.startsWith('beacon model '))
      .map(key => {
        const name = key.substring(13)

        return {
          name,
          active: beacon.model === name
        }
      })

    return models
  },

  getExcludeObjectParts: (state): ExcludeObjectPart[] => {
    const exclude_object = state.printer.exclude_object

    if (exclude_object == null) {
      return []
    }

    const { objects, current_object, excluded_objects } = exclude_object

    return objects
      .map((obj): ExcludeObjectPart => ({
        ...obj,
        isExcluded: excluded_objects.includes(obj.name),
        isCurrent: current_object === obj.name
      }))
  },

  getHasExcludeObjectParts: (state): boolean => {
    const exclude_object = state.printer.exclude_object

    return (
      exclude_object != null &&
      exclude_object.objects.length > 0
    )
  }
} satisfies GetterTree<PrinterState, RootState>
