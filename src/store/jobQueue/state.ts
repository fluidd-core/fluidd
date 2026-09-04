import type { JobQueueState } from './types'

export const state = (): JobQueueState => {
  return {
    queueState: 'paused',
    queuedJobs: []
  }
}
