export interface TimelapseState {
  settings?: TimelapseSettings;
  lastFrame?: TimelapseLastFrame;
  renderStatus?: RenderStatus;
}

export type TimelapseSettings = TimelapseReadonlySettings & TimelapseWritableSettings;
export type RenderStatus = RenderStarted | RenderRunning | RenderSuccess;

export interface TimelapseLastFrame {
  count: number;
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

export interface TimelapseWritableSettings {
  enabled: boolean;
  autorender: boolean;

  camera: string;
  mode: TimelapseMode;
  parkhead: boolean;
  parkpos: ParkPosition;
  park_time: number;
  park_travel_speed: number;
  park_custom_pos_x: number;
  park_custom_pos_y: number;
  park_custom_pos_dz: number;
  fw_retract: boolean;
  park_retract_distance: number;
  park_retract_speed: number;
  park_extrude_distance: number;
  park_extrude_speed: number;
  gcode_verbose: boolean;

  variable_fps: boolean;
  targetlength: number;
  variable_fps_min: number;
  variable_fps_max: number;
  output_framerate: number;
  stream_delay_compensation: number;

  duplicatelastframe: number;
  constant_rate_factor: number;
  saveframes: boolean;
  previewimage: boolean;
  time_format_code: string;
  pixelformat: string;
  extraoutputparams: string;

  hyperlapse_cycle: number;
}

export type TimelapseMode = 'layermacro' | 'hyperlapse';
export type ParkPosition = 'custom' | 'front_left' | 'front_right' | 'center' | 'back_left' | 'back_right';

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
  msg: string;
}
