export interface ConfigState {
  apiUrl: string;
  socketUrl: string;
  unsavedChanges: boolean;
  localConfig: LocalConfig;
  fileConfig: FileConfig;
}

// This defines localstorage data.
// We should keep these simple, so as to keep local storage to a minimum.
export interface LocalConfig {
  [key: string]: string | boolean | number;
  cameraVisible: boolean;
  chartVisible: boolean;
  limitsVisible: boolean;
}

export interface SaveLocalConfig {
  [key: string]: string | boolean | number;
}

export interface FileConfig {
  general: GeneralConfig;
  camera: CameraConfig;
  dashboard: DashboardConfig;
}

export interface GeneralConfig {
  instanceName: string;
  darkMode: boolean;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: string;
  printTimeEstimationsType: 'file' | 'slicer' | 'filament' | 'totals';
}

export interface CameraConfig {
  enabled: boolean;
  url: string;
  flipX: boolean;
  flipY: boolean;
}

export interface DashboardConfig {
  hiddenMacros: string[];
}

export interface GenericSave {
  key: string;
  value: string | boolean | number;
}
