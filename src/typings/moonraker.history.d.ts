declare namespace Moonraker.History {
  export interface TotalsResponse {
    job_totals: JobTotals;
    auxiliary_totals: AuxiliaryTotal[];
  }

  export interface ResetTotalsResponse {
    last_totals: JobTotals;
    last_auxiliary_totals?: AuxiliaryTotal[];
  }

  export interface ListResponse {
    count: number;
    jobs: Job[];
  }

  export interface JobResponse {
    job: Job;
  }

  export interface DeleteJobResponse {
    deleted_jobs: string[];
  }

  export interface JobTotals {
    total_jobs: number;
    total_time: number;
    total_print_time: number;
    total_filament_used: number;
    longest_job: number;
    longest_print: number;
  }

  export interface AuxiliaryTotal {
    provider: string;
    field: string;
    maximum: number;
    total: number;
  }

  export interface ChangedEvent {
    action: 'added' | 'finished';
    job: Job;
  }

  export interface Job {
    job_id: string;
    exists: boolean;
    end_time: number | null;
    filament_used: number;
    filename: string;
    metadata?: Moonraker.Files.Metadata;
    print_duration: number;
    status: HistoryItemStatus;
    start_time: number;
    total_duration: number;
    user?: string;
    auxiliary_data?: JobAuxiliaryData[];
  }

  export interface JobAuxiliaryData {
    provider: string;
    name: string;
    value: unknown;
    description: string;
    units: string | null;
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.history.list': {
      params: {
        limit?: number,
        start?: number,
        since?: number,
        before?: number,
        order?: 'asc' | 'desc'
      },
      result: History.ListResponse
    },
    'server.history.get_job': {
      params: {
        uid: string
      },
      result: History.JobResponse
    },
    'server.history.delete_job': {
      params: { uid: string } | { all: true },
      result: History.DeleteJobResponse
    },
    'server.history.totals': {
      params: undefined,
      result: History.TotalsResponse
    },
    'server.history.reset_totals': {
      params: undefined,
      result: History.ResetTotalsResponse
    }
  }

  export interface Notifications {
    notify_history_changed: [History.ChangedEvent]
  }
}
