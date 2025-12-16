import type { AppFileMeta } from '@/store/files/types.metadata'

export interface HistoryState {
  count: number;
  jobs: Moonraker.History.Job[];
  job_totals: Moonraker.History.JobTotals;
}

export interface HistoryItem extends Omit<Moonraker.History.Job, 'metadata'> {
  metadata?: AppFileMeta;
}

export type HistoryItemStatus = 'completed' | 'cancelled' | 'error' | 'printing' | 'in_progress' | 'server_exit' | 'klippy_shutdown' | 'klippy_disconnect' | 'interrupted'

export interface HistoryItemAuxiliaryData {
  provider: string;
  name: string;
  value: unknown;
  description: string;
  units: string | null;
}
