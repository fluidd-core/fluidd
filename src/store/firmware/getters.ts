import type { GetterTree } from 'vuex'
import type { FirmwareState, FirmwareUpdateResponse } from './types'
import type { RootState } from '../types'
import { Waits } from '@/globals'
import { SUPPORTED_API_VERSION, updatableMcus } from './helpers'

export const AGENT_NAME = 'aldis'

export const getters = {
  isSupported: (_, __, ___, rootGetters): boolean => {
    return rootGetters['server/agentSupport'](AGENT_NAME)
  },

  isRegistered: (_, __, rootState): boolean => {
    return rootState.server.system_info?.available_services?.includes(AGENT_NAME) ?? false
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

  getMcus: (state, getters): Aldis.Mcu[] => {
    return getters.isApiSupported ? state.status?.mcus ?? [] : []
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

  hasUpdates: (state): boolean => {
    return updatableMcus(state.status).length > 0
  },

  getResponses: (state): FirmwareUpdateResponse[] => {
    return [...state.responses]
  },

  getStatusError: (state): string | null => {
    return state.statusError
  }
} satisfies GetterTree<FirmwareState, RootState>
