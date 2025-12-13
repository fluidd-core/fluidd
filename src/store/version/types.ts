export interface VersionState {
  status: Partial<Moonraker.UpdateManager.StatusResponse> | null;
  responses: UpdateResponse[];
}

export type VersionInfo = Moonraker.UpdateManager.VersionInfoEntry extends { configured_type?: infer K }
  ? Moonraker.UpdateManager.VersionInfoEntry & {
    configured_type: K,
    name: string
  }
  : never

export interface UpdateResponse {
  id: number;
  message: string;
  application: string;
  proc_id: number;
}
