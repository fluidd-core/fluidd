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

  export type QueueState =
    | 'ready'
    | 'loading'
    | 'starting'
    | 'paused'

  export type JobQueueChangedAction =
    | 'state_changed'
    | 'jobs_added'
    | 'jobs_removed'
    | 'job_loaded'

  export interface JobQueueChangedResponse {
    action: JobQueueChangedAction;
    queue_state: QueueState;
    updated_queue?: QueuedJob[] | null;
  }
}
