import { KlipperFileMeta } from '@/store/files/types'

export interface HistoryState {
  count: number;
  jobs: HistoryItem[];
}

export interface HistoryItem {
  job_id: string;
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata: KlipperFileMeta;
  print_duration: number;
  status: string;
  start_time: number;
  total_duration: number;
  exists?: boolean;
}
