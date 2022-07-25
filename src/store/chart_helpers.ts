import { ChartData } from './charts/types'
import store from '@/store'

export const handleMcuStatsChange = (payload: any) => {
  const keys = Object.keys(payload).filter(key => key.startsWith('mcu'))
  if (keys.length > 0) {
    keys.forEach(key => {
      // swap underscores for spaces.
      // const name = key.replace(' ', '_')

      // Combine existing with the update.
      const stats = {
        ...store.state.printer.printer[key],
        ...payload[key]
      }

      if (stats.last_stats) {
        // Datestamp for this chart entry.
        const date = new Date()

        // The last entry in our chart data.
        let lastEntry: any
        if (store.state.charts[key]) {
          lastEntry = store.state.charts[key][store.state.charts[key].length - 1]
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
        store.commit('charts/setChartEntry', {
          type: key,
          retention: 600,
          data: {
            date,
            load: load.toFixed(2),
            awake: awake.toFixed(2),
            bw: bw.toFixed(2)
          }
        })
      }
    })
  }
}

export const handleSystemStatsChange = (payload: any) => {
  if (
    'system_stats' in payload
  ) {
    // Combine existing with the update.
    const stats = {
      ...store.state.printer.printer.system_stats,
      ...payload.system_stats
    }

    // Datestamp for this chart entry.
    const date = new Date()

    // Add an entry for the memory graph.
    if (
      'memavail' in stats &&
      store.state.server.system_info?.cpu_info?.total_memory
    ) {
      const total_memory = store.state.server.system_info?.cpu_info?.total_memory || 0
      const mem_used = total_memory - stats.memavail
      const percent_mem_used = Math.ceil(mem_used / total_memory * 100)

      // Commit the formatted result to our chart data.
      store.commit('charts/setChartEntry', {
        type: 'memory',
        retention: 600,
        data: {
          date,
          memused: percent_mem_used.toFixed(2)
        }
      })
    }

    // Add an entry for the cpu time and sysload.
    if (
      'cputime' in stats &&
      'sysload' in stats
    ) {
      const cputime = stats.cputime
      const last_cputime = store.state.printer.printer.system_stats?.cputime || stats.cputime || 0

      // Commit the formatted result to our chart data.
      store.commit('charts/setChartEntry', {
        type: 'klipper',
        retention: 600,
        data: {
          date,
          load: stats.sysload.toFixed(2),
          cputime_change: ((cputime - last_cputime) * 100).toFixed(2)
        }
      })
    }
  }
}

/**
 * Prepare packet data for a chart entry.
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const handleAddChartEntry = (retention: number, keys: string[]) => {
  const configureChartEntry = () => {
    const date = new Date()
    const r: ChartData = {
      date
    }

    keys.forEach((key) => {
      let label = key
      if (key.includes(' ')) label = key.split(' ')[1]
      const temp = store.state.printer.printer[key].temperature
      const target = store.state.printer.printer[key].target
      const power = store.state.printer.printer[key].power
      const speed = store.state.printer.printer[key].speed
      r[label] = temp
      if (target !== undefined) r[`${label}Target`] = target
      if (power !== undefined) r[`${label}Power`] = power
      if (speed !== undefined) r[`${label}Speed`] = speed
    })

    return r
  }

  if (store.state.charts.ready) {
    const data = configureChartEntry()
    store.commit('charts/setChartEntry', {
      type: 'chart',
      data,
      retention
    })
  }
}
