import { isSocketError } from '@/util/is-socket-error'
import type { FirmwareRunState, FirmwareUpdateResponse } from './types'

export const SUPPORTED_API_VERSION = 1

const KNOWN_UPDATABLE_STATES: readonly string[] = ['update_available']

export const formatResponse = (payload: Aldis.UpdateResponse, id: number): FirmwareUpdateResponse => ({
  id,
  message: payload.mcu
    ? `${payload.mcu}: ${payload.message}`
    : payload.message,
  mcu: payload.mcu,
  phase: payload.phase
})

export const applyEvent = (state: FirmwareRunState, payload: Aldis.UpdateResponse): FirmwareRunState => {
  const responses = [...state.responses, formatResponse(payload, state.responses.length)]

  const next: FirmwareRunState = state.runId === null
    ? { ...state, responses, runId: payload.run_id, busy: true }
    : { ...state, responses }

  return payload.complete
    ? { ...next, busy: false, lastResult: payload.result ?? null, lastMessage: payload.message, resultRunId: payload.run_id }
    : next
}

export const reconcileRun = (state: FirmwareRunState, run: Aldis.Run | null): FirmwareRunState => {
  if (state.runId !== null || run == null) {
    return state
  }

  if (run.state === 'running') {
    return {
      ...state,
      busy: true,
      runId: run.run_id,
      responses: run.messages.map((message, id) => formatResponse(message, id))
    }
  }

  if (state.lastResult === null && run.run_id !== state.dismissedRunId) {
    const last = run.messages[run.messages.length - 1]

    return {
      ...state,
      lastResult: run.result ?? null,
      lastMessage: last?.message ?? null,
      resultRunId: run.run_id
    }
  }

  return state
}

// The agent emits a run's final event before it marks the run finished, so a
// refresh issued on that event can read pre-run MCU rows once. One retry fixes it.
export const needsRetry = (state: FirmwareRunState, run: Aldis.Run | null): boolean => (
  state.runId !== null &&
  !state.busy &&
  run?.state === 'running' &&
  run.run_id === state.runId
)

export const updatableMcus = (status: Aldis.StatusResponse | null): string[] => {
  if (
    status == null ||
    status.blocker != null ||
    status.api_version !== SUPPORTED_API_VERSION
  ) {
    return []
  }

  return status.mcus
    .filter(mcu => KNOWN_UPDATABLE_STATES.includes(mcu.state) && mcu.actions.includes('update'))
    .map(mcu => mcu.name)
}

const isRunResult = (value: unknown): value is Aldis.RunResult => (
  value != null &&
  typeof value === 'object' &&
  'outcome' in value && (value.outcome === 'success' || value.outcome === 'failed') &&
  'klippy_state' in value && typeof value.klippy_state === 'string' &&
  'klipper_left_stopped' in value && typeof value.klipper_left_stopped === 'boolean' &&
  'mcus' in value && Array.isArray(value.mcus)
)

export const isUpdateResponse = (value: unknown): value is Aldis.UpdateResponse => (
  value != null &&
  typeof value === 'object' &&
  'run_id' in value && typeof value.run_id === 'string' &&
  'message' in value && typeof value.message === 'string' &&
  'complete' in value && typeof value.complete === 'boolean' &&
  'phase' in value && typeof value.phase === 'string' &&
  'mcu' in value && (value.mcu === null || typeof value.mcu === 'string') &&
  (!('result' in value) || value.result == null || isRunResult(value.result))
)

const isRun = (value: unknown): value is Aldis.Run => (
  value != null &&
  typeof value === 'object' &&
  'run_id' in value && typeof value.run_id === 'string' &&
  'state' in value && (value.state === 'running' || value.state === 'finished') &&
  'messages' in value && Array.isArray(value.messages) && value.messages.every(isUpdateResponse) &&
  (!('result' in value) || value.result == null || isRunResult(value.result))
)

export const isStatusResponse = (value: unknown): value is Aldis.StatusResponse => (
  value != null &&
  typeof value === 'object' &&
  'api_version' in value && typeof value.api_version === 'number' &&
  'host' in value && value.host != null && typeof value.host === 'object' &&
  'mcus' in value && Array.isArray(value.mcus) &&
  value.mcus.every(mcu => (
    mcu != null &&
    typeof mcu === 'object' &&
    'name' in mcu && typeof mcu.name === 'string' &&
    'state' in mcu && typeof mcu.state === 'string' &&
    'actions' in mcu && Array.isArray(mcu.actions) &&
    'message' in mcu && typeof mcu.message === 'string' &&
    'running_version' in mcu && (mcu.running_version === null || typeof mcu.running_version === 'string')
  )) &&
  (!('run' in value) || value.run == null || isRun(value.run))
)

export const apiVersionOf = (value: unknown): number | null => (
  value != null &&
  typeof value === 'object' &&
  'api_version' in value &&
  typeof value.api_version === 'number'
    ? value.api_version
    : null
)

export const unsupportedStatus = (apiVersion: number): Aldis.StatusResponse => ({
  api_version: apiVersion,
  host: { klippy_state: 'disconnected', klippy_message: '' },
  blocker: null,
  mcus: [],
  run: null
})

const nestedAgentError = (error: unknown): Aldis.AgentError | null => {
  if (
    error != null &&
    typeof error === 'object' &&
    'data' in error &&
    error.data != null &&
    typeof error.data === 'object' &&
    'message' in error.data &&
    typeof error.data.message === 'string'
  ) {
    return error.data as Aldis.AgentError
  }

  return null
}

export const agentErrorMessage = (error: unknown): string => {
  const nested = nestedAgentError(error)

  if (nested) {
    return nested.message
  }

  if (isSocketError(error)) {
    return error.message
  }

  return error instanceof Error
    ? error.message
    : String(error)
}

export const agentErrorReason = (error: unknown): string | null => {
  const reason = nestedAgentError(error)?.data?.reason

  return typeof reason === 'string'
    ? reason
    : null
}
