import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface JobQueueState {
  queue_state: QueueState;
  queued_jobs: QueuedJob[];
}

export interface QueuedJob {
  filename: string;
  job_id: string;
  time_added: number;
  time_in_queue: number;
}

export interface QueuedJobWithAppFile extends QueuedJob {
  file?: AppFile | AppFileWithMeta;
}

export type QueueState = 'ready' | 'loading' | 'starting' | 'paused'
