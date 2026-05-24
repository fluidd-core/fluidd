import type { ActionTree } from 'vuex'
import type {
  SpoolmanState,
  WebsocketBasePayload,
  WebsocketFilamentPayload,
  WebsocketSpoolPayload,
  WebsocketVendorPayload
} from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'
import { gte, valid } from 'semver'

const logPrefix = '[SPOOLMAN]'

const payloadAsSpoolmanProxyResponseV2 = <T>(payload: Moonraker.Spoolman.ProxyResponse<T>): Moonraker.Spoolman.ProxyResponseV2<T> => {
  if (
    payload != null &&
    typeof payload === 'object' &&
    'error' in payload &&
    'response' in payload
  ) {
    if (payload.error != null) {
      EventBus.$emit(typeof payload.error === 'string' ? payload.error : payload.error.message, { type: 'error' })
    }

    return payload
  }

  return {
    error: null,
    response: payload
  }
}

const createSpoolmanSocket = (spoolmanUrl: string): WebSocket | undefined => {
  try {
    const socketUrl = new URL(spoolmanUrl)

    socketUrl.pathname += `${socketUrl.pathname.endsWith('/') ? '' : '/'}api/v1/`
    socketUrl.protocol = socketUrl.protocol === 'https:'
      ? 'wss:'
      : 'ws:'

    return new WebSocket(socketUrl)
  } catch (err) {
    consola.error(`${logPrefix} failed to create websocket`, err)
  }
}

interface FilaManPaginatedResponse {
  items?: FilaManSpool[];
}

interface FilaManSpool {
  id: number;
  created_at?: string | null;
  last_used_at?: string | null;
  purchase_price?: number | null;
  remaining_weight_g?: number | null;
  initial_total_weight_g?: number | null;
  empty_spool_weight_g?: number | null;
  lot_number?: string | null;
  location_id?: number | null;
  custom_fields?: Record<string, unknown> | null;
  filament?: FilaManFilament | null;
}

interface FilaManFilament {
  id: number;
  designation?: string | null;
  material_type?: string | null;
  price?: number | null;
  raw_material_weight_g?: number | null;
  default_spool_weight_g?: number | null;
  diameter_mm?: number | null;
  density_g_cm3?: number | null;
  manufacturer?: FilaManManufacturer | null;
  colors?: FilaManFilamentColor[] | null;
}

interface FilaManFilamentColor {
  color?: {
    hex_code?: string | null;
  } | null;
}

interface FilaManManufacturer {
  id?: number | null;
  name?: string | null;
  empty_spool_weight_g?: number | null;
}

const DEFAULT_DENSITY_G_CM3 = 1.24
const DEFAULT_DIAMETER_MM = 1.75

const isFilamanPaginatedResponse = (value: unknown): value is FilaManPaginatedResponse => {
  return (
    value != null &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray((value as FilaManPaginatedResponse).items)
  )
}

const numberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return undefined
}

const normalizedColorHex = (hex: string): string => {
  return hex.startsWith('#')
    ? hex.slice(1)
    : hex
}

const mapFilamanSpoolToSpoolmanSpool = (spool: FilaManSpool): Moonraker.Spoolman.Spool => {
  const registered = spool.created_at ?? new Date().toISOString()
  const filament = spool.filament
  const manufacturer = filament?.manufacturer

  const density = numberOrUndefined(filament?.density_g_cm3) ?? DEFAULT_DENSITY_G_CM3
  const diameter = numberOrUndefined(filament?.diameter_mm) ?? DEFAULT_DIAMETER_MM

  const initialTotalWeight = numberOrUndefined(spool.initial_total_weight_g)
  const spoolWeight = numberOrUndefined(spool.empty_spool_weight_g)
  const fallbackFilamentWeight = numberOrUndefined(filament?.raw_material_weight_g)

  let initialWeight: number | undefined = fallbackFilamentWeight
  if (initialTotalWeight != null && spoolWeight != null) {
    initialWeight = Math.max(initialTotalWeight - spoolWeight, 0)
  }

  const remainingWeight = numberOrUndefined(spool.remaining_weight_g)
  const usedWeight = (
    initialWeight != null &&
    remainingWeight != null
  )
    ? Math.max(initialWeight - remainingWeight, 0)
    : undefined

  const colors = (filament?.colors ?? [])
    .map(entry => entry.color?.hex_code)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalizedColorHex)

  const primaryColor = colors[0]
  const multiColorHexes = colors.length > 1
    ? colors.join(',')
    : undefined

  const vendor: Moonraker.Spoolman.Vendor | undefined = manufacturer?.name
    ? {
        id: numberOrUndefined(manufacturer.id) ?? 0,
        registered,
        name: manufacturer.name,
        empty_spool_weight: numberOrUndefined(manufacturer.empty_spool_weight_g)
      }
    : undefined

  const spoolmanSpool: Moonraker.Spoolman.Spool = {
    id: spool.id,
    registered,
    filament: {
      id: filament?.id ?? 0,
      registered,
      density,
      diameter,
      name: filament?.designation ?? undefined,
      vendor,
      material: filament?.material_type ?? undefined,
      price: numberOrUndefined(filament?.price),
      weight: fallbackFilamentWeight,
      spool_weight: numberOrUndefined(filament?.default_spool_weight_g),
      color_hex: primaryColor,
      multi_color_hexes: multiColorHexes,
    },
    last_used: spool.last_used_at ?? undefined,
    price: numberOrUndefined(spool.purchase_price),
    remaining_weight: remainingWeight,
    initial_weight: initialWeight,
    spool_weight: spoolWeight,
    used_weight: usedWeight,
    lot_nr: spool.lot_number ?? undefined,
    location: spool.location_id != null
      ? `#${spool.location_id}`
      : undefined,
    archived: false,
    extra: spool.custom_fields ?? undefined
  }

  return spoolmanSpool
}

const normalizeSpoolList = (
  payload: Moonraker.Spoolman.Spool[] | FilaManPaginatedResponse
): Moonraker.Spoolman.Spool[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (isFilamanPaginatedResponse(payload)) {
    return payload.items?.map(mapFilamanSpoolToSpoolmanSpool) ?? []
  }

  return []
}

const supportsFilaman = (rootState: RootState): boolean => {
  return rootState.server.info.components.includes('filaman')
}

const supportsSpoolmanComponent = (rootState: RootState): boolean => {
  return rootState.server.info.components.includes('spoolman')
}

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the spoolman component.
   */
  async init ({ rootState }) {
    if (supportsFilaman(rootState)) {
      SocketActions.serverFilamanGetSpoolId()
      SocketActions.serverFilamanProxyGetAvailableSpools({
        dispatch: 'spoolman/onAvailableSpools'
      })
      return
    }

    SocketActions.serverSpoolmanGetSpoolId()
    SocketActions.serverSpoolmanProxyGetAvailableSpools()
    SocketActions.serverSpoolmanProxyGetInfo()
  },

  async onActiveSpool ({ commit }, payload) {
    commit('setActiveSpool', payload.spool_id)
  },

  async onSpoolChange ({ commit, state }, { type, payload }: WebsocketSpoolPayload) {
    const spools = [...state.spools]

    switch (type) {
      case 'added': {
        spools.push(payload)

        break
      }

      case 'updated': {
        const index = spools.findIndex(spool => spool.id === payload.id)

        if (index >= 0) {
          spools[index] = payload
        }

        break
      }

      case 'deleted': {
        const index = spools.findIndex(spool => spool.id === payload.id)

        if (index >= 0) {
          spools.splice(index, 1)
        }

        break
      }
    }

    commit('setSpools', spools)
  },

  async onFilamentChange ({ commit, state }, { type, payload }: WebsocketFilamentPayload) {
    if (type !== 'updated') {
      // we only care about updated filament types
      return
    }

    const spools = state.spools
      .map(spool => (
        spool.filament.id === payload.id
          ? {
              ...spool,
              filament: payload
            }
          : spool
      ))

    commit('setSpools', spools)
  },

  async onVendorChange ({ commit, state }, { type, payload }: WebsocketVendorPayload) {
    if (type !== 'updated') {
      // we only care about updated vendors
      return
    }

    const spools = state.spools
      .map(spool => (
        spool.filament.vendor?.id === payload.id
          ? {
              ...spool,
              filament: {
                ...spool.filament,
                vendor: payload
              }
            }
          : spool
      ))

    commit('setSpools', spools)
  },

  async onStatusChanged ({ commit, dispatch }, payload: boolean) {
    if (payload) {
      // refresh data, connected state will be set on data retrieval
      dispatch('init')
    } else {
      commit('setConnected', payload)
    }
  },

  async onAvailableSpools ({ commit, dispatch }, payload: Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Spool[]>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setSpools', normalizeSpoolList(payload.response))

    commit('setConnected', true)

    dispatch('initializeWebsocketConnection')
  },

  async onInfo ({ state, commit }, payload: Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Info>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setInfo', payload.response)

    if (
      state.info &&
      valid(state.info.version) &&
      gte(state.info.version, '0.16.0')
    ) {
      SocketActions.serverSpoolmanProxyGetSettingCurrency()
    }
  },

  async onSettingCurrency ({ commit }, payload: Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Currency>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setCurrency', payload.response)
  },

  async initializeWebsocketConnection ({ state, getters, rootState, commit, dispatch }) {
    if (supportsSpoolmanComponent(rootState) && rootState.server.config.spoolman?.server) {
      if (state.socket?.readyState === WebSocket.OPEN) {
        // we already have a working WS conn
        return
      }

      // init websocket to listen for updates
      const spoolmanUrl: string = getters.getSpoolmanUrl
      const socket = createSpoolmanSocket(spoolmanUrl)

      if (socket == null) {
        commit('setSocket', null)
        return
      }

      socket.onerror = err => consola.warn(`${logPrefix} received websocket error`, err)
      socket.onmessage = event => {
        let data: WebsocketBasePayload

        try {
          data = JSON.parse(event.data) as WebsocketBasePayload
        } catch (err) {
          consola.error(`${logPrefix} failed to decode websocket message`, err, event.data)
          return
        }

        switch (data.resource) {
          case 'spool':
            dispatch('onSpoolChange', data)
            break

          case 'filament':
            dispatch('onFilamentChange', data)
            break

          case 'vendor':
            dispatch('onVendorChange', data)
            break

          default:
            consola.warn(`${logPrefix} ignoring websocket message with type ${data.resource}`)
        }
      }

      commit('setSocket', socket)
    } else {
      commit('setSocket', null)
    }
  }
} satisfies ActionTree<SpoolmanState, RootState>
