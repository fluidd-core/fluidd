import type { ActionTree } from 'vuex'
import type { SpoolmanState } from './types'
import type { RootState } from '../types'
import { FilamanActions } from '@/api/filamanActions'
import { normalizeSpoolList } from '@/util/filaman-spool-mapper'
import { payloadAsSpoolmanProxyResponseV2 } from './proxyResponse'

const FILAMAN_PAGE_SIZE = 200
const FILAMAN_MAX_PAGES = 100

export const filamanActions = {
  /**
   * Init the filaman component.
   *
   * Registered in Globals.MOONRAKER_COMPONENTS ahead of the spoolman entry, so the
   * backend flag is committed before `spoolman/init` runs and can bail out.
   */
  async initFilaman ({ commit }) {
    commit('setBackend', 'filaman')

    FilamanActions.getSpoolId()
    FilamanActions.getSpoolIds()
    FilamanActions.proxyGetAvailableSpools(1, FILAMAN_PAGE_SIZE, {
      dispatch: 'spoolman/fetchAllFilamanSpools'
    })
  },

  async onExtruderSpoolsChanged ({ commit }, payload: Moonraker.Spoolman.FilamanExtruderSpoolsResponse) {
    const spools = payload?.extruder_spools

    if (spools != null && typeof spools === 'object') {
      commit('setExtruderSpools', spools)
    }
  },

  /**
   * FilaMan's spool list is paginated; walk every page and keep the store updated
   * as pages arrive.
   */
  async fetchAllFilamanSpools ({ commit, dispatch }, payload: Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.FilamanPaginatedResponse>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    const seenSpoolIds = new Set<number>()
    const allItems: Moonraker.Spoolman.FilamanSpool[] = []
    let pageItems = payload.response?.items ?? []

    const appendUniquePageItems = (items: Moonraker.Spoolman.FilamanSpool[]): number => {
      let appended = 0

      for (const item of items) {
        if (seenSpoolIds.has(item.id)) {
          continue
        }

        seenSpoolIds.add(item.id)
        allItems.push(item)
        appended += 1
      }

      return appended
    }

    appendUniquePageItems(pageItems)
    commit('setSpools', normalizeSpoolList({ items: allItems }))

    let page = 2
    while (pageItems.length === FILAMAN_PAGE_SIZE && page <= FILAMAN_MAX_PAGES) {
      const nextPayload = payloadAsSpoolmanProxyResponseV2(
        await FilamanActions.proxyGetAvailableSpools(page, FILAMAN_PAGE_SIZE)
      )

      if (nextPayload.error != null) {
        break
      }

      pageItems = nextPayload.response?.items ?? []

      if (pageItems.length === 0) {
        break
      }

      if (appendUniquePageItems(pageItems) === 0) {
        break
      }

      commit('setSpools', normalizeSpoolList({ items: allItems }))

      if (pageItems.length < FILAMAN_PAGE_SIZE) {
        break
      }

      page += 1
    }

    commit('setSpools', normalizeSpoolList({ items: allItems }))
    commit('setConnected', true)

    dispatch('initializeWebsocketConnection')
  }
} satisfies ActionTree<SpoolmanState, RootState>
