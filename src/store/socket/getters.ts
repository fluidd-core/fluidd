import Vue from 'vue'
import { GetterTree } from 'vuex'
import { Heater, Fan, SocketState, TimeEstimates, Sensor, Chart, ChartDataSet, RunoutSensor, BedMesh, Thumbnail } from './types'
import { RootState } from '../types'
import { chartConfiguration } from '@/globals'
import { TinyColor } from '@ctrl/tinycolor'
import { get } from 'lodash-es'

export const getters: GetterTree<SocketState, RootState> = {
  /**
   * Indicates if our socket is connected / open.
   */
  getConnectionState: (state): boolean => {
    return state.open
  },

  /**
   * Indicates if klippy is connected or not.
   */
  getKlippyState: (state): boolean => {
    if (state.printer.info.state !== 'ready') {
      return false
    }
    return true
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
    // We may have more than one thumb - so pick the largest.
    let thumb: Thumbnail | undefined
    if (
      state.printer.current_file &&
      state.printer.current_file.thumbnails &&
      state.printer.current_file.thumbnails.length
    ) {
      state.printer.current_file.thumbnails.forEach((item: Thumbnail) => {
        if (!thumb || (item.size > thumb.size)) {
          thumb = { ...item }
        }
      })
    }

    if (thumb) {
      thumb.data = 'data:image/gif;base64,' + thumb.data
    }
    return thumb
  },

  /**
   * Returns an object representing the time estimates of a current print.
   */
  getTimeEstimates: (state) => (type: 'slicer' | 'file' | 'filament' | 'totals'): TimeEstimates => {
    const progress = state.printer.display_status.progress || 0
    const duration = state.printer.print_stats.print_duration || 0
    const usedFilament = state.printer.print_stats.filament_used || 0
    const estimatedFilament = state.printer.current_file.filament_total || 0
    let timeLeft = 0
    let totalDuration = 0

    switch (type) {
      case 'slicer': {
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
        totalDuration = duration / (progress * 100) - duration
        timeLeft = totalDuration - duration
      }
    }

    const o = {
      type,
      progress: (progress * 100).toFixed(),
      timeLeft: Vue.$filters.formatCounterTime(timeLeft),
      duration: Vue.$filters.formatCounterTime(duration),
      totalDuration: Vue.$filters.formatCounterTime(totalDuration)
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
    const sensors: RunoutSensor[] = []
    state.filament_switch_sensors.forEach(name => {
      const sensor = get(state.printer, 'filament_switch_sensor ' + name, undefined)
      sensors.push({
        name,
        ...sensor
      })
    })
    return sensors
  },

  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state) => {
    return (state.printer.configfile.config.bed_mesh)
  },

  /**
   * Returns all available bed meshes, including those only in memory / currently loaded.
   */
  getBedMeshes: (state): BedMesh[] => {
    const meshes: BedMesh[] = []
    let currentProfile = ''
    if (state.printer.bed_mesh) {
      currentProfile = state.printer.bed_mesh.profile_name
    }
    if (state.printer.configfile && state.printer.configfile.config) {
      for (const item in state.printer.configfile.config) {
        if (item.includes(' ')) {
          const split = item.split(' ')
          if (
            split.length > 0 &&
            split[0] === 'bed_mesh'
          ) {
            /* eslint-disable @typescript-eslint/camelcase */
            const profile: BedMesh = {
              profile_name: split[1],
              active: false
            }
            if (currentProfile === split[1]) profile.active = true
            meshes.push(profile)
          }
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

  /**
   * Return available heaters
   */
  getHeaters: (state): Heater[] => {
    if (
      state.printer.heaters.available_heaters &&
      state.printer.heaters.available_heaters.length
    ) {
      const r: Heater[] = []
      state.printer.heaters.available_heaters.forEach((e: string) => {
        const heater = state.printer[e]
        if (heater && Object.keys(heater).length > 0) {
          const config = (state.printer.configfile.config[e]) ? state.printer.configfile.config[e] : undefined
          r.push({
            name: e,
            ...heater,
            minTemp: (config && config.min_temp) ? parseInt(config.min_temp) : null,
            maxTemp: (config && config.max_temp) ? parseInt(config.max_temp) : null
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

  /**
  * Return available temperature fans
  */
  getFans: (state): Fan[] => {
    if (
      state.temperature_fans &&
      state.temperature_fans.length
    ) {
      const r: Fan[] = []
      state.temperature_fans.forEach((e: string) => {
        const fan = state.printer['temperature_fan ' + e]
        if (fan && Object.keys(fan).length > 0) {
          const config = (state.printer.configfile.config['temperature_fan ' + e]) ? state.printer.configfile.config['temperature_fan ' + e] : undefined
          r.push({
            name: e,
            ...fan,
            minTemp: (config && config.min_temp) ? parseInt(config.min_temp) : null,
            maxTemp: (config && config.max_temp) ? parseInt(config.max_temp) : null
          })
        }
      })
      return r
    }
    return []
  },

  /**
   * Return available temperature probes / sensors.
   */
  getSensors: (state): Sensor[] => {
    const r: Sensor[] = []
    if (
      state.temperature_sensors &&
      state.temperature_sensors.length
    ) {
      state.temperature_sensors.forEach((e: string) => {
        const sensor = state.printer['temperature_sensor ' + e]
        if (sensor && Object.keys(sensor).length > 0) {
          r.push({
            name: e,
            ...sensor,
            minMeasuredTemp: (sensor.measured_min_temp) ? sensor.measured_min_temp : null,
            maxMeasuredTemp: (sensor.measured_max_temp) ? sensor.measured_max_temp : null
          })
        }
      })
    }

    if (
      state.temperature_probes &&
      state.temperature_probes.length
    ) {
      state.temperature_probes.forEach((e: string) => {
        const sensor = state.printer['temperature_probe ' + e]
        if (sensor && Object.keys(sensor).length > 0) {
          r.push({
            name: e,
            ...sensor
          })
        }
      })
    }
    return r
  },

  /**
   * Return macros that are visible on the dashboard.
   */
  getVisibleMacros: (state) => {
    const macros: string[] = []
    for (const macro in state.macros) {
      if (state.macros[macro].visible) {
        macros.push(macro)
      }
    }
    return macros
  },

  /**
   * Determine if we have a wait active or not.
   */
  hasWait: (state) => (wait: string): boolean => {
    return state.waits.includes(wait)
  },

  /**
   * Determine if we have any waits.
   */
  hasWaits: (state) => {
    return state.waits.length > 0
  },

  getChartData: (state) => {
    const chartData: Chart = {
      labels: [],
      datasets: []
    }

    state.chart.forEach((item) => {
      // Based on the name of this sensor, pick appropriate colors.
      // Beds should probably be some variation of blue;
      // Hotends should be some variation of red;
      // Other sensors can hue off'f green.
      const defaults: ChartDataSet = {
        data: item.data,
        label: item.label,
        display: false,
        radius: item.radius,
        spanGaps: true,
        borderWidth: 1
      }

      let isTarget = false
      let namedColor = chartConfiguration.COLORS.NAMED[item.label]

      if (item.label.includes('Target')) {
        isTarget = true
        namedColor = chartConfiguration.COLORS.NAMED[item.label.replace('Target', '')]
      }

      if (namedColor) {
        if (isTarget) {
          defaults.fill = false
          defaults.borderColor = new TinyColor(namedColor).lighten(25).toRgbString()
        } else {
          defaults.fill = true
          defaults.borderColor = new TinyColor(namedColor).toRgbString()
          defaults.backgroundColor = new TinyColor(namedColor).setAlpha(0.1).toRgbString()
        }
      }
      chartData.datasets.push(defaults)
    })
    return chartData
  }

}
