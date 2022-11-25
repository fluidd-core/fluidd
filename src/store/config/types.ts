import { AppTablePartialHeader } from '@/types/tableheaders'
import { VuetifyThemeItem } from 'vuetify/types/services/theme'
import { FileFilterType, FileRoot } from '../files/types'

export interface ConfigState {
  [key: string]: any;
  apiUrl: string;
  socketUrl: string;
  layoutMode: boolean;
  containerColumnCount: number;
  instances: InstanceConfig[];
  uiSettings: UiSettings;
  hostConfig: HostConfig;
}

export interface UiSettings {
  general: GeneralConfig;
  theme: ThemeConfig;
  editor: EditorConfig;
  dashboard: DashboardConfig;
  tableHeaders: AppTableConfiguredHeaders;
  gcodePreview: GcodePreviewConfig;
  fileSystem: FileSystemConfig;
  toolhead: ToolheadConfig;
}

export interface ToolheadConfig {
  forceMove: boolean;
  extrudeSpeed: number;
  extrudeLength: number;
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  hosted: boolean;
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
  toolheadMoveDistances: number[];
  useGcodeCoords: boolean;
  zAdjustDistances: number[];
  enableVersionNotifications: boolean;
  confirmOnEstop: boolean;
  confirmOnPowerDeviceChange: boolean;
  confirmOnSaveConfigAndRestart: boolean;
  dateFormat: string;
  timeFormat: string;
  showRateOfChange: boolean;
  showRelativeHumidity: boolean;
  showBarometricPressure: boolean;
  showSaveConfigAndRestart: boolean;
  flipConsoleLayout: boolean;
  cameraFullscreenAction: CameraFullscreenAction;
  topNavPowerToggle: null | string;
  showManualProbeDialogAutomatically: boolean;
  showBedScrewsAdjustDialogAutomatically: boolean;
  forceMoveToggleWarning: boolean;
  enableDiagnostics: boolean;
  thumbnailSize: number;
}

export type CameraFullscreenAction = 'embed' | 'rawstream';

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

export interface EditorConfig {
  confirmDirtyEditorClose: boolean;
  autoEditExtensions: string[];
  codeLens: boolean;
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
  gcode?: string;
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
  groupLowerLayers: boolean;
  autoLoadOnPrintStart: boolean;
  autoFollowOnFileLoad: boolean;
  autoZoom: boolean;
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
}

export interface FileSystemConfig {
  activeFilters: Partial<Record<FileRoot, FileFilterType[]>>
}
