import type { Commit } from 'vuex'
import type { RootState } from './types'
import type { ChartData } from './charts/types'
import getMcusFromConfig from '@/util/get-klipper-mcus-from-config'

const decimalRound = (value: number) => {
  return Math.round(value * 100) / 100
}

export const handleMcuStatsChange = (payload: Partial<Klipper.PrinterState>, state: RootState, commit: Commit) => {
  for (const key in payload) {
    if (key.startsWith('mcu')) {
      // Combine existing with the update.
      const stats: Klipper.McuState = {
        ...state.printer.printer[key],
        ...payload[key]
      }

      if (stats.last_stats != null) {
        // Datestamp for this chart entry.
        const date = new Date()

        // The last entry in our chart data.
        let lastEntry: any
        if (state.charts[key]) {
          lastEntry = state.charts[key][state.charts[key].length - 1]
        }

        // Load & Awake times
        const task_max = 0.0025
        const stats_interval = 5
        const load = 100 * (stats.last_stats.mcu_task_avg + (3 * stats.last_stats.mcu_task_stddev)) / task_max
        const awake = 100 * (stats.last_stats.mcu_awake / stats_interval)

        // Bandwidth
        // We really need the time passed on from klipper, and the a known
        // max for serial, usb or can to accurately chart this.
        // 25000 === 250,0000 bps is a guess and not accurate.
        // The time delta below is innacurate since its not reflective of when
        // klipper recorded the data.
        const maxbw = 25000

        // The time delta between the last and this entry.
        const timedelta = (lastEntry) ? date.getTime() - lastEntry.date.getTime() : 1000

        let bw = stats.last_stats.bytes_write + stats.last_stats.bytes_retransmit
        let lastbw = (lastEntry) ? parseFloat(lastEntry.bw) : bw
        if (bw < lastbw) lastbw = bw
        bw = 100 * (bw - lastbw) / (maxbw * timedelta)

        // Commit the formatted result to our chart data.
        commit('charts/setChartEntry', {
          type: key,
          retention: 600,
          data: {
            date,
            load: decimalRound(load),
            awake: decimalRound(awake),
            bw: decimalRound(bw)
          }
        }, { root: true })
      }
    }
  }
}

export const handleSystemStatsChange = (payload: Partial<Klipper.PrinterState>, state: RootState, commit: Commit) => {
  if (payload.system_stats != null) {
    // Combine existing with the update.
    const stats: Klipper.SystemStatsState = {
      ...state.printer.printer.system_stats,
      ...payload.system_stats
    }

    // Datestamp for this chart entry.
    const date = new Date()

    // Add an entry for the memory graph.
    if (
      stats.memavail != null &&
      state.server.system_info?.cpu_info?.total_memory
    ) {
      const total_memory = state.server.system_info.cpu_info.total_memory || 0
      const mem_used = total_memory - stats.memavail
      const percent_mem_used = Math.ceil(mem_used / total_memory * 100)

      // Commit the formatted result to our chart data.
      commit('charts/setChartEntry', {
        type: 'memory',
        retention: 600,
        data: {
          date,
          memused: decimalRound(percent_mem_used)
        }
      }, { root: true })
    }

    // Add an entry for the cpu time and sysload.
    if (
      stats.cputime != null &&
      stats.sysload != null
    ) {
      const cputime = stats.cputime
      const last_cputime = state.printer.printer.system_stats?.cputime || stats.cputime || 0

      // Commit the formatted result to our chart data.
      commit('charts/setChartEntry', {
        type: 'klipper',
        retention: 600,
        data: {
          date,
          load: decimalRound(stats.sysload),
          cputime_change: decimalRound((cputime - last_cputime) * 100)
        }
      }, { root: true })
    }
  }
}

export const handleAddSensorChartEntry = (state: RootState, commit: Commit) => {
  const date = new Date()

  for (const sensorId in state.sensors.sensors) {
    const { values } = state.sensors.sensors[sensorId]

    const data: ChartData = {
      date
    }

    let hasNumericValue = false

    for (const field in values) {
      const value = values[field]

      if (typeof value === 'number') {
        data[field] = decimalRound(value)

        hasNumericValue = true
      }
    }

    if (hasNumericValue) {
      commit('charts/setChartEntry', {
        type: `sensor:${sensorId}`,
        retention: 600,
        data
      }, { root: true })
    }
  }
}

/**
 * Prepare packet data for a chart entry.
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const handleAddChartEntry = (retention: number, state: RootState, commit: Commit, getters: any) => {
  const nonCriticalDisconnectedMcusSet: Set<string> = getters.getNonCriticalDisconnectedMcusSet

  const configureChartEntry = () => {
    const chartData: ChartData = {
      date: new Date()
    }

    const keys: string[] = getters.getChartableSensors

    for (const key of keys) {
      const sensor = state.printer.printer[key]

      if (sensor != null) {
        if (nonCriticalDisconnectedMcusSet.size > 0) {
          const config = state.printer.printer.configfile?.settings[key.toLowerCase()]

          if (
            config != null &&
            getMcusFromConfig(config)?.some(mcu => nonCriticalDisconnectedMcusSet.has(mcu))
          ) {
            continue
          }
        }

        const { temperature, target, power, speed } = sensor

        chartData[key] = decimalRound(temperature)

        if (target != null) {
          chartData[`${key}#target`] = decimalRound(target)
        }

        if (power != null) {
          chartData[`${key}#power`] = decimalRound(power)
        }

        if (speed != null) {
          chartData[`${key}#speed`] = decimalRound(speed)
        }
      }
    }

    return chartData
  }

  if (state.charts.ready) {
    const data = configureChartEntry()
    commit('charts/setChartEntry', {
      type: 'chart',
      data,
      retention
    }, { root: true })
  }
}
