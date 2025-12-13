import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface JobQueueState {
  queueState: Moonraker.JobQueue.QueueState;
  queuedJobs: Moonraker.JobQueue.QueuedJob[];
}

export interface QueuedJobWithAppFile extends Moonraker.JobQueue.QueuedJob {
  file?: AppFile | AppFileWithMeta;
}
