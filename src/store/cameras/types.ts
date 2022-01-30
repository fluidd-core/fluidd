export interface CamerasState {
  activeCamera: string;
  cameras: CameraConfig[];
}

export interface CameraConfig {
  id: string;
  enabled: boolean;
  name: string;
  type: 'mjpgadaptive' | 'mjpgstream' | 'ipstream' | 'iframe';
  url: string;
  fpstarget?: number;
  flipX: boolean;
  flipY: boolean;
  rotate?: '90' | '180' | '270';
  height?: number;
}
