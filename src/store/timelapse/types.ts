export interface TimelapseState {
  settings?: TimelapseSettings;
  lastFrame?: TimelapseLastFrame;
  renderStatus?: RenderStatus;
}

export interface TimelapseSettings {
  enabled: boolean
  mode: string
  camera: string
  snapshoturl: string
  stream_delay_compensation: number
  gcode_verbose: boolean
  parkhead: boolean
  parkpos: string
  park_custom_pos_x: number
  park_custom_pos_y: number
  park_custom_pos_dz: number
  park_travel_speed: number
  park_retract_speed: number
  park_extrude_speed: number
  park_retract_distance: number
  park_extrude_distance: number
  park_time: number
  fw_retract: boolean;
  hyperlapse_cycle: number;
  autorender: boolean;
  constant_rate_factor: number;
  output_framerate: number;
  pixelformat: string;
  time_format_code: string;
  extraoutputparams: string;
  variable_fps: boolean;
  targetlength: number;
  variable_fps_min: number;
  variable_fps_max: number;
  rotation: number;
  flip_x: boolean;
  flip_y: boolean;
  duplicatelastframe: number;
  previewimage: boolean;
  saveframes: boolean;
  blockedsettings: any[];
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
  settings: RenderSettings
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
