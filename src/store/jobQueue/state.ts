import type { JobQueueState } from './types'

export const createState = (): JobQueueState => {
  return {
    queueState: 'paused',
    queuedJobs: []
  }
}
