export interface CamerasState {
  activeCamera: string;
  cameras: CameraConfig[];
}

export interface MoonrakerWebcamConfig
{
  name: string,
  location?: string,
  service?: string;
  targetFps?: number,
  urlStream?: string,
  urlSnapshot?: string,
  flipX?: boolean,
  flipY?: boolean,
  rotation: number,
  source?: 'config' | 'database'
}

export interface CameraConfigWithoutId extends MoonrakerWebcamConfig {
  enabled: boolean;
  height?: number;
  targetFpsIdle?: number;
}

export interface CameraConfig extends CameraConfigWithoutId {
  id: string;
}

export interface LegacyCamerasState {
  activeCamera: string;
  cameras: LegacyCameraConfig[];
}

export interface LegacyCameraConfig {
  id: string;
  enabled: boolean;
  name: string;
  type: 'mjpgadaptive' | 'mjpgstream' | 'ipstream' | 'iframe';
  url: string;
  fpstarget?: number;
  fpsidletarget?: number;
  flipX: boolean;
  flipY: boolean;
  rotate?: '90' | '180' | '270';
  height?: number;
}
