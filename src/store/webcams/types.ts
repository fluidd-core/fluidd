export interface WebcamsState {
  webcams: WebcamConfig[];
}

export interface WebcamConfig
{
  name: string,
  location?: string,
  service?: string;
  target_fps?: number,
  stream_url?: string,
  snapshot_url?: string,
  flip_horizontal?: boolean,
  flip_vertical?: boolean,
  rotation?: number,
  source?: 'config' | 'database'
}
