import type { PluginsState } from './types'

export const defaultState = (): PluginsState => {
  return {
    naviPoints: [],
    naviPointsLoaded: false
  }
}

export const state = defaultState()
