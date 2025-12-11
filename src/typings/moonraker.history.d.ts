declare namespace Moonraker.History {
  export interface TotalsResponse {
    job_totals: JobTotals;
    auxiliary_totals: AuxiliaryTotal[];
  }

  export interface ListResponse {
    count: number;
    jobs: Job[];
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

  export interface Job {
    job_id: string;
    exists: boolean;
    end_time: string | null;
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
