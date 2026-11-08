import type { FirmwareState } from './types'

export const createState = (): FirmwareState => {
  return {
    initialised: false,
    status: null,
    statusError: null,
    retried: false,
    refreshing: false,
    pending: false,
    run: null,
    logRunId: null,
    dismissedRunId: null
  }
}
