export interface JobQueueState {
  queue_state: JobQueueQueueState;
  jobs: QueueJob[];
}

export interface QueueJob {
  filename: string;
  job_id: string;
  time_added: number;
  time_in_queue: number;
}

export type JobQueueQueueState = 'ready' | 'loading' | 'starting' | 'paused'
