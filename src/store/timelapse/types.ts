export interface TimelapseState {
  settings: Moonraker.Timelapse.SettingsResponse | null;
  lastFrame: TimelapseLastFrame | null;
  renderStatus: RenderStatus | null;
}

export type RenderStatus = RenderStarted | RenderRunning | RenderSuccess

export interface TimelapseLastFrame {
  count: number;
  uniqueCount: number;
  file: string;
}

export interface TimelapseReadonlySettings {
  readonly blockedsettings: string[];
  // legacy options, overridden by webcam integration
  readonly snapshoturl: string;
  readonly rotation: number;
  readonly flip_x: boolean;
  readonly flip_y: boolean;
}

export type TimelapseMode = 'layermacro' | 'hyperlapse'
export type ParkPosition = 'custom' | 'front_left' | 'front_right' | 'center' | 'back_left' | 'back_right' | 'x_only' | 'y_only'

export interface RenderSettings {
  frameRate: number;
  crf: number;
  pixelFormat: string;
}

export interface RenderStarted {
  status: 'started';
  frameCount: number;
  settings: RenderSettings;
}

export interface RenderRunning {
  status: 'running';
  progress: number;
}

export interface RenderSuccess {
  status: 'success';
  frameCount: number;
  fileName: string;
  printFile: string;
  previewImage: string;
  message: string;
}
