import { JobQueueState } from './types'

export const defaultState = (): JobQueueState => {
  return {
    queue_state: 'paused',
    jobs: []
  }
}

export const state = defaultState()
