import { KlipperFileMeta } from '@/store/files/types'

export interface HistoryState {
  count: number;
  jobs: HistoryItem[];
}

export interface HistoryItem {
  job_id: string;
  exists: boolean;
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata: KlipperFileMeta;
  print_duration: number;
  status: HistoryItemStatus;
  start_time: number;
  total_duration: number;
  path?: string;
}

export enum HistoryItemStatus {
  Printing = 'printing',
  Completed = 'completed',
  InProgress = 'in_progress',
  Standby = 'standby',
  Cancelled = 'cancelled',
  Error = 'error',
  Klippy_Shutdown = 'klippy_shutdown',
  Klippy_Disconnect = 'klippy_disconnect'
}
