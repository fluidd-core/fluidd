import { KlipperFileMeta } from '@/store/files/types'

export interface HistoryState {
  count: number;
  jobs: HistoryItem[];
  job_totals: HistoryRollUp;
}

export interface HistoryItem {
  job_id: string;
  exists: boolean;
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata?: KlipperFileMeta;
  print_duration: number;
  status: HistoryItemStatus;
  start_time: number;
  total_duration: number;
  path?: string;
}

export interface HistoryRollUp {
  total_jobs: number;
  total_time: number;
  total_print_time: number;
  total_filament_used: number;
  longest_job: number;
  longest_print: number;
}

export enum HistoryItemStatus {
  Completed = 'completed',
  Cancelled = 'cancelled',
  Error = 'error',
  Printing = 'printing',
  InProgress = 'in_progress',
  Server_Exit = 'server_exit',
  Klippy_Shutdown = 'klippy_shutdown',
  Klippy_Disconnect = 'klippy_disconnect'
}
