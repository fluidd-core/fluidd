import type { DiagnosticsState } from './types'

export const defaultState = (): DiagnosticsState => ({
  watchValues: {}
})

export const state = defaultState()
