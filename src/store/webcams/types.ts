export interface WebcamsState {
  webcams: Moonraker.Webcam.Entry[];
  activeWebcam: string;
}

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
  service: Moonraker.Webcam.Service;
  targetFps: number;
  targetFpsIdle: number;
  urlStream: string;
  urlSnapshot: string;
  flipX: boolean;
  flipY: boolean;
  rotation: Moonraker.Webcam.Rotation;
  aspectRatio: string;
  extraData: Record<string, unknown>;
}
