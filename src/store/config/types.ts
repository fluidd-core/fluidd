import { AppTablePartialHeader } from '@/types/tableheaders'
import { VuetifyThemeItem } from 'vuetify/types/services/theme'

export interface ConfigState {
  [key: string]: any;
  apiUrl: string;
  socketUrl: string;
  layoutMode: boolean;
  instances: InstanceConfig[];
  uiSettings: UiSettings;
  hostConfig: HostConfig;
}

export interface UiSettings {
  general: GeneralConfig;
  theme: ThemeConfig;
  dashboard: DashboardConfig;
  tableHeaders: AppTableConfiguredHeaders;
  gcodePreview: GcodePreviewConfig;
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  hosted: boolean;
  locales: SupportedLocale[];
  themePresets: SupportedTheme[];
}

export interface SupportedLocale {
  name: string;
  code: string;
}

export interface GeneralConfig {
  instanceName: string;
  locale: string;
  chartVisible: boolean;
  hideTempWaits: boolean;
  axis: Axis;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: number;
  defaultToolheadXYSpeed: number;
  defaultToolheadZSpeed: number;
  printTimeEstimationsType: 'file' | 'slicer' | 'filament' | 'totals';
  useGcodeCoords: boolean;
  zAdjustDistances: number[];
  enableVersionNotifications: boolean;
  confirmOnEstop: boolean;
}

// Config stored in moonraker db
export interface ThemeConfig {
  currentTheme: {[index: string]: string | Partial<VuetifyThemeItem> | undefined }; // the color list.
  isDark: boolean; // inidicates if the theme as a whole is dark or not.
  logo: SupportedThemeLogo; // Current logo to use.
}

// Config defined in host
export interface SupportedTheme {
  name: string;
  logo: SupportedThemeLogo;
  color: string;
  isDark: boolean;
}

export interface SupportedThemeLogo {
  src: string;
  dynamic: boolean;
  dark?: string;
  light?: string;
}

export interface Axis {
  [key: string]: AxisConfig;
}

export interface AxisConfig {
  inverted: boolean;
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
  apiAuthenticated?: boolean;
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
  id: number;
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

export interface AppTableConfiguredHeaders {
  [root: string]: AppTablePartialHeader[];
}

export interface GcodePreviewConfig {
  extrusionLineWidth: number;
  moveLineWidth: number;
  retractionIconSize: number;
  drawBackground: boolean;
  showAnimations: boolean;
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
}
