import { createChartBuffer } from '@/util/chart-buffer'
import { Globals } from '@/globals'
import type { ChartState } from './types'

// Fixed-shape buckets pre-create columns so their dimension names exist from
// the first sample; thermal and diagnostics discover theirs at runtime.
export const defaultState = (): ChartState => {
  return {
    ready: false,
    thermal: createChartBuffer(Globals.CHART_HISTORY_RETENTION),
    klipper: createChartBuffer(Globals.CHART_SYSTEM_RETENTION, ['load', 'cputime_change']),
    memory: createChartBuffer(Globals.CHART_SYSTEM_RETENTION, ['memused']),
    moonraker: createChartBuffer(Globals.CHART_SYSTEM_RETENTION, ['load']),
    diagnostics: createChartBuffer(Globals.CHART_HISTORY_RETENTION),
    mcus: {},
    sensors: {},
    selectedLegends: {}
  }
}

export const state = defaultState()
