import type { ActionTree } from 'vuex'
import type { FirmwareState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import i18n from '@/plugins/i18n'
import { isAgentConnectedEvent, isAgentDisconnectedEvent } from '@/util/is-agent-event'
import { SUPPORTED_API_VERSION, agentErrorMessage, apiVersionOf, applyEvent, endLostRun, isStatusResponse, isUpdateResponse, needsRetry, reconcileRun, unsupportedStatus } from './helpers'

const NOTIFICATION_ID = 'firmware-updates-available'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init ({ state, commit, dispatch }) {
    if (state.initialised) {
      return
    }

    commit('setInitialised', true)

    await dispatch('refresh')
  },

  async refresh ({ state, commit, dispatch }) {
    if (state.refreshing) {
      return
    }

    commit('setRefreshing', true)

    try {
      await dispatch('fetchStatus')
    } finally {
      commit('setRefreshing', false)
    }
  },

  // Bypasses the refresh guard: an in-flight refresh may predate the run finishing
  async fetchStatus ({ commit }) {
    commit('setStatusError', null)

    try {
      await SocketActions.aldisStatus()
    } catch (error) {
      commit('setStatusError', agentErrorMessage(error))
    }
  },

  async onStatus ({ state, commit, dispatch }, payload: Aldis.StatusResponse) {
    const apiVersion = apiVersionOf(payload)

    if (apiVersion !== null && apiVersion !== SUPPORTED_API_VERSION) {
      commit('setStatus', unsupportedStatus(apiVersion))
      commit('setStatusError', null)

      await dispatch('updateNotification')

      return
    }

    if (!isStatusResponse(payload)) {
      commit('setStatusError', i18n.t('app.firmware.label.malformed_status').toString())
      return
    }

    commit('setStatus', payload)
    commit('setStatusError', null)
    commit('setRun', reconcileRun(state.run, payload.run ?? null))

    await dispatch('updateNotification')

    if (payload.run?.state === 'finished') {
      commit('setRetried', false)
    } else if (
      needsRetry(state.run, payload.run) &&
      !state.retried
    ) {
      commit('setRetried', true)

      await dispatch('fetchStatus')
    }
  },

  async updateNotification ({ getters, rootState, dispatch }) {
    if (
      rootState.config.uiSettings.general.enableFirmwareNotifications &&
      getters.hasUpdates
    ) {
      dispatch('notifications/pushNotification', {
        id: NOTIFICATION_ID,
        title: i18n.t('app.firmware.label.updates_available'),
        to: '/settings#firmware',
        btnText: i18n.t('app.firmware.btn.view'),
        type: 'info',
        merge: true
      }, { root: true })
    } else {
      dispatch('notifications/clearNotification', NOTIFICATION_ID, { root: true })
    }
  },

  async update ({ commit, dispatch }, args: Aldis.UpdateArguments) {
    commit('setUpdateStarted')

    try {
      const result = await SocketActions.aldisUpdate(args)

      commit('setRunStarted', result.run_id)
    } catch (error) {
      commit('setPending', false)

      EventBus.$emit(agentErrorMessage(error), { type: 'error' })

      await dispatch('refresh')
    }
  },

  async onAgentEvent ({ state, commit, dispatch }, payload: Moonraker.Extensions.AgentEvent) {
    if (isAgentConnectedEvent(payload)) {
      await dispatch('init')
    } else if (isAgentDisconnectedEvent(payload)) {
      await dispatch('onAgentDisconnected')
    } else if (
      payload.event === 'update_response' &&
      isUpdateResponse(payload.data)
    ) {
      commit('setRun', applyEvent(state.run, payload.data))

      if (payload.data.complete) {
        await dispatch('fetchStatus')
      }
    }
  },

  async onKlippyStateChanged ({ state, dispatch }) {
    if (state.initialised) {
      await dispatch('refresh')
    }
  },

  async onAgentDisconnected ({ state, commit, dispatch }) {
    commit('setInitialised', false)
    commit('setStatus', null)
    commit('setStatusError', null)

    await dispatch('notifications/clearNotification', NOTIFICATION_ID, { root: true })

    const message = i18n.t('app.firmware.status.lost_run').toString()

    if (state.run?.state === 'running') {
      commit('setRun', endLostRun(state.run, message))
    } else if (state.pending) {
      EventBus.$emit(message, { type: 'error' })
    }

    commit('setPending', false)
  }
} satisfies ActionTree<FirmwareState, RootState>
