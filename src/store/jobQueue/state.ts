import { JobQueueState } from './types'

export const defaultState = (): JobQueueState => {
  return {
    queue_state: 'paused',
    queued_jobs: []
  }
}

export const state = defaultState()
