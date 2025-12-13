declare namespace Moonraker.JobQueue {
  export interface StatusResponse {
    queued_jobs: QueuedJob[];
    queue_state: QueueState;
  }

  export interface QueuedJob {
    filename: string;
    job_id: string;
    time_added: number;
    time_in_queue: number;
  }

  export type QueueState = 'ready' | 'loading' | 'starting' | 'paused'
}
