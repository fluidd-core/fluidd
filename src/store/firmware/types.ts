export interface FirmwareState {
  initialised: boolean;
  status: Readonly<Aldis.StatusResponse> | null;
  statusError: string | null;
  retried: boolean;
  refreshing: boolean;
  pending: boolean;
  run: Readonly<Aldis.Run> | null;
  logRunId: string | null;
  lostRunId: string | null;
  dismissedRunId: string | null;
}
