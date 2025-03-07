import type { AppFileMeta, MoonrakerFileMeta } from '@/store/files/types.metadata'

export interface HistoryState {
  count: number;
  jobs: MoonrakerHistoryItem[];
  job_totals: HistoryRollUp;
}

export interface MoonrakerHistoryItem {
  job_id: string;
  exists: boolean;
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata?: MoonrakerFileMeta;
  print_duration: number;
  status: HistoryItemStatus;
  start_time: number;
  total_duration: number;
  user?: string;
  auxiliary_data?: HistoryItemAuxiliaryData[];
}

export interface HistoryItem extends Omit<MoonrakerHistoryItem, 'metadata'> {
  metadata?: AppFileMeta;
}

export interface HistoryRollUp {
  total_jobs: number;
  total_time: number;
  total_print_time: number;
  total_filament_used: number;
  longest_job: number;
  longest_print: number;
}

export type HistoryItemStatus = 'completed' | 'cancelled' | 'error' | 'printing' | 'in_progress' | 'server_exit' | 'klippy_shutdown' | 'klippy_disconnect' | 'interrupted'

export interface HistoryItemAuxiliaryData {
  provider: string;
  name: string;
  value: unknown;
  description: string;
  units: string | null;
}
