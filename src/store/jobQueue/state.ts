import type { JobQueueState } from './types'

export const defaultState = (): JobQueueState => {
  return {
    queueState: 'paused',
    queuedJobs: []
  }
}

export const state = defaultState()
