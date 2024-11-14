export interface WebcamsState {
  webcams: WebcamConfig[];
  activeWebcam: string;
}

export interface NewWebcamConfig {
  name?: string;
  location?: string;
  service?: WebcamService;
  enabled?: boolean;
  icon?: string;
  target_fps?: number;
  target_fps_idle?: number;
  stream_url?: string;
  snapshot_url?: string;
  flip_horizontal?: boolean;
  flip_vertical?: boolean;
  rotation?: WebcamRotation;
  aspect_ratio?: string;
  extra_data?: Record<string, unknown>;
}

export interface WebcamConfig extends NewWebcamConfig {
  uid: string;
  source: WebcamSource;
}

export type WebcamService = 'mjpegstreamer' | 'mjpegstreamer-adaptive' | 'ipstream' | 'iframe' | 'hlsstream' | 'webrtc-camerastreamer' | 'webrtc-go2rtc' | 'webrtc-mediamtx' | 'device'

export type WebcamRotation = 0 | 90 | 180 | 270

export type WebcamSource = 'config' | 'database'

export interface LegacyCamerasState {
  activeCamera: string;
  cameras: LegacyCameraConfig[];
}

export interface LegacyCameraConfig {
  id: string;
  enabled: boolean;
  name: string;
  type: LegacyCameraType;
  url: string;
  fpstarget?: number;
  fpsidletarget?: number;
  flipX: boolean;
  flipY: boolean;
  rotate?: LegacyCameraRotation;
  height?: number;
}

export type LegacyCameraRotation = '0' | '90' | '180' | '270'

export type LegacyCameraType = 'mjpgstream' | 'mjpgadaptive' | 'ipstream' | 'iframe'

export interface DatabaseWebcamConfig {
  name: string;
  location: string;
  icon: string;
  enabled: boolean;
  service: WebcamService;
  targetFps: number;
  targetFpsIdle: number;
  urlStream: string;
  urlSnapshot: string;
  flipX: boolean;
  flipY: boolean;
  rotation: WebcamRotation;
  aspectRatio: string;
  extraData: Record<string, unknown>;
}
