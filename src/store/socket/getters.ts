import Vue from 'vue'
import { GetterTree } from 'vuex'
import { SocketState, TimeEstimates } from './types'
import { RootState } from '../types'
import { chartConfiguration } from '@/globals'
import { TinyColor } from '@ctrl/tinycolor'

export const getters: GetterTree<SocketState, RootState> = {
  /**
   * Indicates if our socket is connected / open.
   */
  getConnectionState: (state): boolean => {
    return state.open
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
        state1.toLowerCase() === 'printing' &&
        state2.toLowerCase() !== 'printing'
      ) {
        return 'busy'
      }
      if (
        state2.toLowerCase() === 'paused'
      ) {
        return state2
      }
      return state1
    } else {
      return 'ready'
    }
  },

  /**
   * Returns an object representing the time estimates of a current print.
   */
  getTimeEstimates: (state) => (type: 'slicer' | 'file' | 'filament'): TimeEstimates => {
    // const filename = state.printer.print_stats.filename
    const progress = state.printer.display_status.progress * 100
    const duration = state.printer.print_stats.print_duration
    let timeLeft = 0
    let totalDuration = 0

    switch (type) {
      case 'slicer': {
        totalDuration = (state.printer.current_file.estimated_time > 0) ? state.printer.current_file.estimated_time : duration
        timeLeft = totalDuration - duration
      }
    }

    return {
      type,
      progress: progress,
      timeLeft: Vue.$filters.formatCounterTime(timeLeft),
      duration: Vue.$filters.formatCounterTime(duration),
      totalDuration: Vue.$filters.formatCounterTime(totalDuration)
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
   * Return available heaters
   */
  getHeaters: (state) => {
    if (
      state.printer.heaters.available_heaters &&
      state.printer.heaters.available_heaters.length
    ) {
      const r: any = []
      state.printer.heaters.available_heaters.forEach((e: string) => {
        const config = (state.printer.configfile.config[e]) ? state.printer.configfile.config[e] : undefined
        r.push({
          name: e,
          ...state.printer[e],
          minTemp: (config && config.min_temp) ? parseInt(config.min_temp) : null,
          maxTemp: (config && config.max_temp) ? parseInt(config.max_temp) : null
        })
      })
      return r.sort((a: any, b: any) => {
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
  getFans: (state) => {
    if (
      state.temperature_fans &&
      state.temperature_fans.length
    ) {
      const r: any = []
      state.temperature_fans.forEach((e: string) => {
        const config = (state.printer.configfile.config['temperature_fan ' + e]) ? state.printer.configfile.config['temperature_fan ' + e] : undefined
        r.push({
          name: e,
          ...state.printer['temperature_fan ' + e],
          minTemp: (config && config.min_temp) ? parseInt(config.min_temp) : null,
          maxTemp: (config && config.max_temp) ? parseInt(config.max_temp) : null
        })
      })
      return r
    }
    return []
  },

  /**
   * Return available temperature probes / sensors.
   */
  getSensors: (state) => {
    if (
      state.temperature_sensors &&
      state.temperature_sensors.length
    ) {
      const r: any = []
      state.temperature_sensors.forEach((e: string) => {
        r.push({
          name: e,
          ...state.printer['temperature_probes ' + e]
        })
      })
      return r
    }
    return []
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
    const chartData: {[key: string]: Array<{[key: string]: any}> } = {
      labels: [],
      datasets: []
    }

    state.chart.forEach((item) => {
      // Based on the name of this sensor, pick appropriate colors.
      // Beds should probably be some variation of blue;
      // Hotends should be some variation of red;
      // Other sensors can hue off'f green.
      const defaults: {[key: string]: any } = {
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
