export interface FirmwareUpdateResponse {
  id: number;
  message: string;
  mcu: string | null;
  phase: string;
}

export interface FirmwareRunState {
  busy: boolean;
  runId: string | null;
  responses: FirmwareUpdateResponse[];
  lastResult: Aldis.RunResult | null;
  lastMessage: string | null;
  resultRunId: string | null;
  dismissedRunId: string | null;
}

export interface FirmwareState extends FirmwareRunState {
  initialised: boolean;
  status: Aldis.StatusResponse | null;
  statusError: string | null;
  retried: boolean;
}
