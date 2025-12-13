export interface TimelapseState {
  settings: Moonraker.Timelapse.SettingsResponse | null;
  lastFrame: Moonraker.Timelapse.LastFrameInfoResponse | null;
  renderStatus: Moonraker.Timelapse.RenderResponse | null;
}

export interface TimelapseLastFrame {
  count: number;
  uniqueCount: number;
  file: string;
}
