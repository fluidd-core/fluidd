export interface CamerasState {
  fillSpace: boolean;
  cameras: CameraConfig[];
}

export interface CameraConfig {
  id: string;
  enabled: boolean;
  name: string;
  type: 'mjpgadaptive' | 'mjpgstream' | 'ipstream';
  url: string;
  fpstarget?: number;
  flipX: boolean;
  flipY: boolean;
}
