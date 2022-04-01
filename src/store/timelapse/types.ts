export interface TimelapseState {
  settings?: TimelapseSettings;
  lastFrame?: TimelapseLastFrame;
  renderStatus?: RenderStatus;
}

export type TimelapseSettings = TimelapseReadonlySettings & TimelapseWritableSettings;

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
  mode: 'layermacro' | 'hyperlapse';
  camera: string;
  stream_delay_compensation: number;
  gcode_verbose: boolean;
  parkhead: boolean;
  parkpos: 'custom' | 'front_left' | 'front_right' | 'center' | 'back_left' | 'back_right';
  park_custom_pos_x: number;
  park_custom_pos_y: number;
  park_custom_pos_dz: number;
  park_travel_speed: number;
  park_retract_speed: number;
  park_extrude_speed: number;
  park_retract_distance: number;
  park_extrude_distance: number;
  park_time: number;
  fw_retract: boolean;
  hyperlapse_cycle: number;
  constant_rate_factor: number;
  output_framerate: number;
  pixelformat: string;
  time_format_code: string;
  extraoutputparams: string;
  variable_fps: boolean;
  targetlength: number;
  variable_fps_min: number;
  variable_fps_max: number;
  duplicatelastframe: number;
  previewimage: boolean;
  saveframes: boolean;
}

export interface TimelapseLastFrame {
  count: number;
  file: string;
}

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

export type RenderStatus = RenderStarted | RenderRunning | RenderSuccess;
