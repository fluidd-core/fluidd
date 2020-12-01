export interface ConfigState {
  [key: string]: string | boolean | LocalConfig | InstanceConfig[] | FileConfig;
  apiUrl: string;
  socketUrl: string;
  unsavedChanges: boolean;
  localConfig: LocalConfig;
  instances: InstanceConfig[];
  fileConfig: FileConfig;
}

// This defines localstorage data.
// We should keep these simple, so as to keep local storage to a minimum.
export interface LocalConfig {
  [key: string]: string | boolean | number;
}

export interface FileConfig {
  general: GeneralConfig;
  camera: CameraConfig;
  dashboard: DashboardConfig;
}

export interface GeneralConfig {
  instanceName: string;
  jobsInMenu: boolean;
  jobsInDash: boolean;
  darkMode: boolean;
  axis: Axis;
  invertZControl: boolean;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: string;
  printTimeEstimationsType: 'file' | 'slicer' | 'filament' | 'totals';
}

export interface Axis {
  [key: string]: AxisConfig;
}

export interface AxisConfig {
  inverted: boolean;
}

export interface CameraConfig {
  enabled: boolean;
  type: 'mjpgstreamer' | 'ipcamera';
  url: string;
  flipX: boolean;
  flipY: boolean;
}

export interface DashboardConfig {
  hiddenMacros: string[];
  tempPresets: TemperaturePreset[];
}

export interface GenericSave {
  key: string;
  value: string | boolean | number;
}

export interface Config {
  apiConfig: ApiConfig | InstanceConfig;
  fileConfig: FileConfig | undefined | null;
}

export interface ApiConfig {
  apiUrl: string;
  socketUrl: string;
}

export interface InstanceConfig extends ApiConfig {
  name: string;
  active: boolean;
}

export interface TemperaturePreset {
  name: string;
  values: TemperaturePresetValues;
}

export interface TemperaturePresetValues {
  [key: string]: TemperaturePresetValue;
}

export interface TemperaturePresetValue {
  value: number;
  type: 'fan' | 'heater';
  active: boolean;
}
