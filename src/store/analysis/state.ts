import type { AnalysisState } from './types'

export const defaultState = (): AnalysisState => {
  return {
    status: null
  }
}

export const state = defaultState()
