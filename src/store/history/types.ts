import { KlipperFileMeta } from '@/store/files/types'

export interface HistoryState {
  count: number;
  prints: HistoryItems;
}

export interface HistoryItems {
  [index: number]: HistoryItem;
}

export interface HistoryItem {
  end_time: string | null;
  filament_used: number;
  filename: string;
  metadata: KlipperFileMeta[];
  print_duration: number;
  status: string;
  start_time: number;
  total_duration: number;
}
