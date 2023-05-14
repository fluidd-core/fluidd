export interface WebcamsState {
  webcams: WebcamConfig[];
}

export interface WebcamConfig
{
  name: string,
  location?: string,
  service?: string;
  enabled?: boolean;
  icon?: string;
  target_fps?: number,
  target_fps_idle?: number,
  stream_url?: string,
  snapshot_url?: string,
  flip_horizontal?: boolean,
  flip_vertical?: boolean,
  rotation?: WebcamRotation,
  aspect_ratio?: string,
  extra_data?: any,
  source?: WebcamSource
}

export type WebcamRotation = 0 | 90 | 180 | 270
export type WebcamSource = 'config' | 'database'
