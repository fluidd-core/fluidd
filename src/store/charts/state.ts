import type { ChartState } from './types'

export const defaultState = (): ChartState => {
  return {
    ready: false,
    chart: [],
    selectedLegends: {}
  }
}

export const state = defaultState()
