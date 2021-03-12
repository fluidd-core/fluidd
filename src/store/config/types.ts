import { VuetifyThemeItem } from 'vuetify/types/services/theme'

export interface ConfigState {
  [key: string]: any;
  apiUrl: string;
  socketUrl: string;
  layoutMode: boolean;
  cardState: CardState; // if a collapsable card is collapsed or not.
  cardLayout: CardLayout; // position and state of draggable cards.
  instances: InstanceConfig[];
  uiSettings: UiSettings;
  hostConfig: HostConfig;
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
  theme: ThemeConfig;
  camera: CameraConfig;
  dashboard: DashboardConfig;
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  hosted: boolean;
}

export interface GeneralConfig {
  instanceName: string;
  chartVisible: boolean;
  hideTempWaits: boolean;
  axis: Axis;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: string;
  defaultToolheadXYSpeed: number;
  defaultToolheadZSpeed: number;
  printTimeEstimationsType: 'file' | 'slicer' | 'filament' | 'totals';
  useGcodeCoords: boolean;
}

export interface ThemeConfig {
  currentTheme: {[index: string]: string | Partial<VuetifyThemeItem> | undefined }; // the color list.
  isDark: boolean; // inidicates if the theme as a whole is dark or not.
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
  tempPresets: TemperaturePreset[];
}

export interface SaveByPath {
  path: string;
  value: string | boolean | number;
  server?: boolean;
}

export interface InitConfig {
  apiConfig: ApiConfig | InstanceConfig;
  hostConfig?: HostConfig;
  apiConnected?: boolean;
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
