import Vue from 'vue'
import type { NotifyOptions } from '@/plugins/socketClient'
import { consola } from 'consola'

const baseEmit = async <T = unknown>(method: string, options: NotifyOptions): Promise<T> => {
  if (!Vue.$socket) {
    consola.warn('Socket emit denied, socket not ready.', method, options)

    throw new Error('Socket not ready')
  } else {
    const result = await Vue.$socket.emit(method, options)

    return result as T
  }
}

export const FilamanActions = {
  getSpoolId (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.SpoolIdResponse>(
      'server.filaman.get_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options
      }
    )
  },

  getSpoolIds (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.FilamanExtruderSpoolsResponse>(
      'server.filaman.spool_ids', {
        dispatch: 'spoolman/onExtruderSpoolsChanged',
        ...options
      }
    )
  },

  postSpoolId (spoolId: number | undefined, extruder?: string, options?: NotifyOptions) {
    const params: Record<string, unknown> = spoolId != null ? { spool_id: spoolId } : {}
    if (extruder != null) params.extruder = extruder

    return baseEmit<Moonraker.Spoolman.SpoolIdResponse>(
      'server.filaman.post_spool_id', {
        dispatch: extruder != null ? 'spoolman/onExtruderSpoolsChanged' : 'spoolman/onActiveSpool',
        ...options,
        params
      }
    )
  },

  proxyGetAvailableSpools (page = 1, pageSize = 200, options?: NotifyOptions) {
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize)
    }).toString()

    return baseEmit<Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.FilamanPaginatedResponse>>(
      'server.filaman.proxy', {
        ...options,
        params: {
          request_method: 'GET',
          path: '/api/v1/spools',
          query,
          use_v2_response: true
        }
      }
    )
  }
}
