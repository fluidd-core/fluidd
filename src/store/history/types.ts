import type { AppFileMeta } from '@/store/files/types.metadata'

export interface HistoryState {
  count: number;
  jobs: Readonly<Moonraker.History.Job>[];
  job_totals: Moonraker.History.JobTotals;

  /**
   * Jobs resolved individually via `server.history.get_job`, for files whose
   * job sits outside the page `jobs` holds. Kept apart from `jobs` so the
   * history page keeps showing a contiguous page rather than an arbitrary
   * set of jobs the file browser happened to ask for.
   *
   * A plain object rather than a Map: Vue 2 cannot make a Map reactive, so
   * this is mutated with `Vue.set` / `Vue.delete`.
   */
  jobsById: Record<string, Readonly<Moonraker.History.Job> | undefined>;

  /**
   * Job ids Moonraker answered `404` for - the job was deleted but the file
   * metadata still names it. Cached so a directory of orphaned files does not
   * re-request them on every load.
   */
  missingJobIds: Record<string, true | undefined>;
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
