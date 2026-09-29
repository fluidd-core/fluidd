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

  export interface ChangedEvent {
    action: JobQueueChangedAction;
    queue_state: QueueState;
    updated_queue: QueuedJob[] | null;
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.job_queue.status': {
      params: undefined,
      result: JobQueue.StatusResponse
    },
    'server.job_queue.post_job': {
      params: {
        filenames: string[],
        reset?: boolean
      },
      result: JobQueue.StatusResponse
    },
    'server.job_queue.delete_job': {
      params: { job_ids: string[] } | { all: true },
      result: JobQueue.StatusResponse
    },
    'server.job_queue.pause': {
      params: undefined,
      result: JobQueue.StatusResponse
    },
    'server.job_queue.start': {
      params: undefined,
      result: JobQueue.StatusResponse
    }
  }

  export interface Notifications {
    notify_job_queue_changed: [JobQueue.ChangedEvent]
  }
}
