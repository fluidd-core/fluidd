export interface FirmwareUpdateResponse {
  id: number;
  message: string;
  mcu: string | null;
  phase: string;
}

export interface FirmwareState {
  initialised: boolean;
  status: Aldis.StatusResponse | null;
  statusError: string | null;
  retried: boolean;
  refreshing: boolean;
  pending: boolean;
  run: Aldis.Run | null;
  logRunId: string | null;
  dismissedRunId: string | null;
}
