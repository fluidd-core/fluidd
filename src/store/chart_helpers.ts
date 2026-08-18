import type { Commit } from 'vuex'
import type { RootState } from './types'
import { chartBufferLastTime, chartBufferLastValue } from '@/util/chart-buffer'
import { thermalColumn } from './charts/thermal-columns'
import getMcusFromConfig from '@/util/get-klipper-mcus-from-config'
import { Globals } from '@/globals'
import decimalRound from '@/util/decimal-round'

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
        const time = Date.now()

        // The last entry in our chart data.
        const buffer = state.charts.mcus[key]
        const lastTime = chartBufferLastTime(buffer)
        const lastBw = chartBufferLastValue(buffer, 'bw')

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

        // The time delta between the last and this entry, clamped so that two
        // updates within the same millisecond don't divide by zero below.
        const timedelta = (lastTime != null) ? Math.max(1, time - lastTime) : 1000

        let bw = stats.last_stats.bytes_write + stats.last_stats.bytes_retransmit
        const lastbw = Math.min(bw, lastBw ?? bw)
        bw = 100 * (bw - lastbw) / (maxbw * timedelta)

        // Commit the formatted result to our chart data.
        commit('charts/setChartEntry', {
          bucket: 'mcu',
          id: key,
          retention: Globals.CHART_SYSTEM_RETENTION,
          time,
          values: {
            load: decimalRound(load, 2),
            awake: decimalRound(awake, 2),
            bw: decimalRound(bw, 2)
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
    const time = Date.now()

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
        bucket: 'memory',
        retention: Globals.CHART_SYSTEM_RETENTION,
        time,
        values: {
          memused: decimalRound(percent_mem_used, 2)
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
        bucket: 'klipper',
        retention: Globals.CHART_SYSTEM_RETENTION,
        time,
        values: {
          load: decimalRound(stats.sysload, 2),
          cputime_change: decimalRound((cputime - last_cputime) * 100, 2)
        }
      }, { root: true })
    }
  }
}

export const handleAddSensorChartEntry = (state: RootState, commit: Commit) => {
  const time = Date.now()

  for (const sensorId in state.sensors.sensors) {
    const { values: sensorValues } = state.sensors.sensors[sensorId]

    const values: Record<string, number> = {}
    let hasNumericValue = false

    for (const field in sensorValues) {
      const value = sensorValues[field]

      if (typeof value === 'number') {
        values[field] = decimalRound(value, 2)
        hasNumericValue = true
      }
    }

    if (hasNumericValue) {
      commit('charts/setChartEntry', {
        bucket: 'sensor',
        id: sensorId,
        retention: Globals.CHART_SYSTEM_RETENTION,
        time,
        values
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
    const values: Record<string, number> = {}

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

        values[thermalColumn(key)] = decimalRound(temperature, 2)

        if (target != null) {
          values[thermalColumn(key, 'target')] = decimalRound(target, 2)
        }

        if (power != null) {
          values[thermalColumn(key, 'power')] = decimalRound(power, 2)
        }

        if (speed != null) {
          values[thermalColumn(key, 'speed')] = decimalRound(speed, 2)
        }
      }
    }

    return values
  }

  if (state.charts.ready) {
    const values = configureChartEntry()
    commit('charts/setChartEntry', {
      bucket: 'thermal',
      retention,
      time: Date.now(),
      values
    }, { root: true })
  }
}
