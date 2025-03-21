import type { Commit } from 'vuex'
import type { RootState } from './types'
import type { ChartData } from './charts/types'
import type { KlipperPrinterMcuState, KlipperPrinterState, KlipperPrinterSystemStatsState } from './printer/types'

export const handleMcuStatsChange = (payload: KlipperPrinterState, state: RootState, commit: Commit) => {
  for (const key in payload) {
    if (key.startsWith('mcu')) {
      // Combine existing with the update.
      const stats: KlipperPrinterMcuState = {
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
            load: load.toFixed(2),
            awake: awake.toFixed(2),
            bw: bw.toFixed(2)
          }
        }, { root: true })
      }
    }
  }
}

export const handleSystemStatsChange = (payload: KlipperPrinterState, state: RootState, commit: Commit) => {
  if (payload.system_stats != null) {
    // Combine existing with the update.
    const stats: KlipperPrinterSystemStatsState = {
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
          memused: percent_mem_used.toFixed(2)
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
          load: stats.sysload.toFixed(2),
          cputime_change: ((cputime - last_cputime) * 100).toFixed(2)
        }
      }, { root: true })
    }
  }
}

/**
 * Prepare packet data for a chart entry.
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const handleAddChartEntry = (retention: number, state: RootState, commit: Commit, getters: any) => {
  const configureChartEntry = () => {
    const chartData: ChartData = {
      date: new Date()
    }

    const keys: string[] = getters.getChartableSensors

    keys.forEach((key) => {
      const sensor = state.printer.printer[key]

      if (sensor != null) {
        const temp = sensor.temperature
        const target = sensor.target
        const power = sensor.power
        const speed = sensor.speed
        chartData[key] = temp
        if (target != null) chartData[`${key}#target`] = target
        if (power != null) chartData[`${key}#power`] = power
        if (speed != null) chartData[`${key}#speed`] = speed
      }
    })

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
