import type { GetterTree } from 'vuex'
import type { FirmwareState } from './types'
import type { ConsoleLogEntry } from '@/store/console/types'
import type { RootState } from '../types'
import { Globals, Waits } from '@/globals'
import { SUPPORTED_API_VERSION, finishedRunOf, formatResponse, updatableMcus } from './helpers'

export const getters = {
  isSupported: (_, __, rootState): boolean => {
    return rootState.extensions.agents.some(agent => agent.name === Globals.MOONRAKER_AGENTS.aldis.name)
  },

  isRegistered: (_, __, rootState): boolean => {
    return rootState.server.system_info?.available_services?.includes(Globals.MOONRAKER_AGENTS.aldis.name) ?? false
  },

  isAvailable: (_, getters): boolean => {
    return getters.isSupported || getters.isRegistered
  },

  isLoading: (state, getters, ___, rootGetters): boolean => {
    return (
      getters.isSupported &&
      state.status === null &&
      rootGetters['wait/hasWait'](Waits.onFirmwareRefresh)
    )
  },

  isApiSupported: (state): boolean => {
    return state.status === null || state.status.api_version === SUPPORTED_API_VERSION
  },

  getMcus: (state): Aldis.Mcu[] => {
    return state.status?.mcus ?? []
  },

  getBlocker: (state): Aldis.Blocker | null => {
    return state.status?.blocker ?? null
  },

  getHost: (state, getters): Aldis.Host | null => {
    return getters.isApiSupported ? state.status?.host ?? null : null
  },

  getUpdatableMcus: (state): string[] => {
    return updatableMcus(state.status)
  },

  hasUpdates: (_, getters): boolean => {
    return getters.getUpdatableMcus.length > 0
  },

  isBusy: (state): boolean => {
    return state.pending || state.run?.state === 'running'
  },

  getResponses: (state): ConsoleLogEntry[] => {
    const run = state.run

    return (
      run != null &&
      run.run_id === state.logRunId
    )
      ? run.messages.map(formatResponse)
      : []
  },

  getFinishedRun: (state): Aldis.Run | null => {
    return finishedRunOf(state)
  },

  getLastResult: (_, getters): Aldis.RunResult | null => {
    return getters.getFinishedRun?.result ?? null
  },

  getLastMessage: (_, getters): string | null => {
    const messages = getters.getFinishedRun?.messages ?? []

    return messages[messages.length - 1]?.message ?? null
  },
} satisfies GetterTree<FirmwareState, RootState>
