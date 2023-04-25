export interface CamerasState {
  activeCamera: string;
  cameras: CameraConfig[];
}

export interface MoonrakerWebcamConfig
{
  name: string,
  location?: string,
  service?: string;
  enabled?: boolean,
  icon?: string,
  targetFps?: number,
  targetFpsIdle?: number,
  urlStream?: string,
  urlSnapshot?: string,
  flipX?: boolean,
  flipY?: boolean,
  rotation: MoonrakerWebcamRotation,
  aspectRatio?: string;
  extraData?: any,
  source?: MoonrakerWebcamSource
}

export type MoonrakerWebcamRotation = 0 | 90 | 180 | 270
export type MoonrakerWebcamSource = 'config' | 'database'

export interface CameraConfigWithoutId extends MoonrakerWebcamConfig {
  service?: CameraService;
}

export interface CameraConfig extends CameraConfigWithoutId {
  id: string;
}

export type CameraService = 'mjpegstreamer' | 'mjpegstreamer-adaptive' | 'ipstream' | 'iframe' | 'hlsstream'

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

export type LegacyCameraRotation = '90' | '180' | '270'
export type LegacyCameraType = 'mjpgstream' | 'mjpgadaptive' | 'ipstream' | 'iframe'
