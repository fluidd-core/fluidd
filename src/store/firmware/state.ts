import type { FirmwareState } from './types'

export const createState = (): FirmwareState => {
  return {
    initialised: false,
    status: null,
    statusError: null,
    retried: false,
    busy: false,
    runId: null,
    responses: [],
    lastResult: null,
    lastMessage: null,
    resultRunId: null,
    dismissedRunId: null
  }
}
