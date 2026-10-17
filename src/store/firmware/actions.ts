import type { ActionTree } from 'vuex'
import type { FirmwareRunState, FirmwareState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import i18n from '@/plugins/i18n'
import { SUPPORTED_API_VERSION, agentErrorMessage, apiVersionOf, applyEvent, isStatusResponse, isUpdateResponse, needsRetry, reconcileRun, unsupportedStatus } from './helpers'

const NOTIFICATION_ID = 'firmware-updates-available'

const runStateOf = (state: FirmwareState): FirmwareRunState => ({
  busy: state.busy,
  runId: state.runId,
  responses: state.responses,
  lastResult: state.lastResult,
  lastMessage: state.lastMessage,
  resultRunId: state.resultRunId,
  dismissedRunId: state.dismissedRunId
})

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

  async refresh ({ commit }) {
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
    commit('setRunState', reconcileRun(runStateOf(state), payload.run ?? null))

    await dispatch('updateNotification')

    if (payload.run?.state === 'finished') {
      commit('setRetried', false)
    } else if (needsRetry(runStateOf(state), payload.run) && !state.retried) {
      commit('setRetried', true)

      await dispatch('refresh')
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

      commit('setRunId', result.run_id)
    } catch (error) {
      commit('setBusy', false)

      EventBus.$emit(agentErrorMessage(error), { type: 'error' })

      await dispatch('refresh')
    }
  },

  async onAgentEvent ({ state, commit, dispatch }, payload: Moonraker.Server.AgentEvent) {
    if (
      payload.event !== 'update_response' ||
      !isUpdateResponse(payload.data)
    ) {
      return
    }

    commit('setRunState', applyEvent(runStateOf(state), payload.data))

    if (payload.data.complete) {
      await dispatch('refresh')
    }
  },

  async onKlippyStateChanged ({ state, dispatch }) {
    if (state.initialised) {
      await dispatch('refresh')
    }
  },

  async onAgentDisconnected ({ state, commit, dispatch }) {
    commit('setInitialised', false)

    await dispatch('notifications/clearNotification', NOTIFICATION_ID, { root: true })

    if (state.busy) {
      const message = i18n.t('app.firmware.status.lost_run').toString()
      const current = runStateOf(state)

      commit('setRunState', {
        ...current,
        busy: false,
        responses: [...current.responses, { id: current.responses.length, message, mcu: null, phase: 'done' }],
        lastMessage: message
      })
    }
  }
} satisfies ActionTree<FirmwareState, RootState>
