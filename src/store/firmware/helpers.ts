import { isSocketError } from '@/util/is-socket-error'
import type { FirmwareState, FirmwareUpdateResponse } from './types'

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

export const applyEvent = (run: Aldis.Run | null, payload: Aldis.UpdateResponse): Aldis.Run => {
  const current: Aldis.Run = run?.run_id === payload.run_id
    ? run
    : {
        run_id: payload.run_id,
        state: 'running',
        messages: [],
        result: null
      }

  const messages = [...current.messages, payload]

  return payload.complete
    ? {
        ...current,
        messages,
        state: 'finished',
        result: payload.result ?? null
      }
    : {
        ...current,
        messages
      }
}

export const endLostRun = (run: Aldis.Run, message: string): Aldis.Run => ({
  ...run,
  state: 'finished',
  result: null,
  messages: [
    ...run.messages,
    {
      run_id: run.run_id,
      mcu: null,
      phase: 'done',
      message,
      complete: true
    }
  ]
})

export const reconcileRun = (current: Aldis.Run | null, run: Aldis.Run | null): Aldis.Run | null => {
  if (run == null) {
    return current
  }

  if (current?.run_id !== run.run_id) {
    return run
  }

  if (current.state === 'running') {
    return run.messages.length >= current.messages.length
      ? run
      : { ...run, messages: current.messages }
  }

  // A running snapshot predates the final event; a lost run takes the agent's outcome
  return (
    run.state === 'finished' &&
    current.result == null
  )
    ? run
    : current
}

export const finishedRunOf = (state: FirmwareState): Aldis.Run | null => {
  const run = state.run

  return (
    run?.state === 'finished' &&
    !state.pending &&
    run.run_id !== state.dismissedRunId
  )
    ? run
    : null
}

// The agent emits a run's final event before it marks the run finished, so a
// refresh issued on that event can read pre-run MCU rows once. One retry fixes it.
export const needsRetry = (current: Aldis.Run | null, run: Aldis.Run | null): boolean => (
  current?.state === 'finished' &&
  run?.state === 'running' &&
  run.run_id === current.run_id
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
    .filter(mcu => (
      KNOWN_UPDATABLE_STATES.includes(mcu.state) &&
      mcu.actions.includes('update')
    ))
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
  host: {
    klippy_state: 'disconnected',
    klippy_message: ''
  },
  blocker: null,
  mcus: [],
  run: null
})

const isAgentError = (value: unknown): value is Aldis.AgentError => (
  value != null &&
  typeof value === 'object' &&
  'message' in value &&
  typeof value.message === 'string'
)

export const agentErrorMessage = (error: unknown): string => {
  if (isSocketError(error)) {
    return (
      'data' in error &&
      isAgentError(error.data)
    )
      ? error.data.message
      : error.message
  }

  return error instanceof Error
    ? error.message
    : String(error)
}
