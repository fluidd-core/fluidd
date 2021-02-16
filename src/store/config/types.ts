export interface ConfigState {
  [key: string]: any;
  apiUrl: string;
  socketUrl: string;
  unsavedChanges: boolean;
  layoutMode: boolean;
  appState: AppState;
  cardState: CardState; // if a collapsable card is collapsed or not.
  cardLayout: CardLayout; // position and state of draggable cards.
  instances: InstanceConfig[];
  uiSettings: UiSettings;
  hostConfig: HostConfig;
  consoleHistory: string[];
}

export interface AppState {
  [key: string]: any;
  chartSelectedLegends: ChartSelectedLegends;
}

export interface ChartSelectedLegends {
  [key: string]: boolean;
}

// Saved to local storage.
export interface CardLayout {
  [key: string]: CardConfig[];
}

export interface CardConfig {
  name: string;
  enabled: boolean;
}

// Saved to local storage.
export interface CardState {
  [key: string]: boolean;
}

export interface UiSettings {
  general: GeneralConfig;
  camera: CameraConfig;
  dashboard: DashboardConfig;
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  skipClientUpdates: boolean;
}

export interface GeneralConfig {
  instanceName: string;
  chartVisible: boolean;
  darkMode: boolean;
  hideTempWaits: boolean;
  axis: Axis;
  invertZControl: boolean;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: string;
  defaultToolheadXYSpeed: number;
  defaultToolheadZSpeed: number;
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
  fileConfig?: FileConfig;
  hostConfig?: HostConfig;
}

export interface FileConfig {
  [index: string]: any;
  uiSettings?: UiSettings;
  consoleHistory?: string[];
}

export interface ApiConfig {
  apiUrl: string;
  socketUrl: string;
}

// Saved to localstorage.
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
