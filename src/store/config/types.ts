import type { AppTablePartialHeader } from '@/types/tableheaders'
import type { FileFilterType } from '../files/types'

export interface ConfigState {
  [key: string]: any;
  appReady: boolean;
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
  spoolman: SpoolmanConfig;
}

export interface ToolheadConfig {
  forceMove: boolean;
  extrudeSpeed: number;
  extrudeLength: number;
}

export interface SpoolmanConfig {
  autoSpoolSelectionDialog: boolean;
  autoOpenQRDetectionCamera: string | null;
  autoSelectSpoolOnMatch: boolean;
  preferDeviceCamera: boolean;
  warnOnNotEnoughFilament: boolean;
  warnOnFilamentTypeMismatch: boolean;
  selectionDialogSortOrder: {
    key: string | null;
    desc: boolean | null;
  },
  remainingFilamentUnit: 'weight' | 'length'
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  hosted: boolean;
  themePresets: ThemePreset[];
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
  toolheadControlStyle: ToolheadControlStyle;
  toolheadMoveDistances: number[];
  toolheadXYMoveDistances: number[];
  toolheadZMoveDistances: number[];
  toolheadCircleXYMoveDistances: number[];
  toolheadCircleZMoveDistances: number[];
  toolheadCircleXYHomingEnabled: boolean;
  useGcodeCoords: boolean;
  zAdjustDistances: number[];
  enableVersionNotifications: boolean;
  confirmOnEstop: boolean;
  confirmOnPowerDeviceChange: boolean;
  confirmOnSaveConfigAndRestart: boolean;
  sectionsToIgnorePendingConfigurationChanges: string[];
  dateFormat: string;
  timeFormat: string;
  enableKeyboardShortcuts: boolean;
  textSortOrder: TextSortOrder;
  showRateOfChange: boolean;
  showRelativeHumidity: boolean;
  showBarometricPressure: boolean;
  showGasResistance: boolean;
  showSaveConfigAndRestart: boolean;
  showUploadAndPrint: boolean;
  flipConsoleLayout: boolean;
  cameraFullscreenAction: CameraFullscreenAction;
  topNavPowerToggle: null | string;
  showManualProbeDialogAutomatically: boolean;
  showBedScrewsAdjustDialogAutomatically: boolean;
  showScrewsTiltAdjustDialogAutomatically: boolean;
  forceMoveToggleWarning: boolean;
  printInProgressLayout: PrintInProgressLayout;
  printProgressCalculation: PrintProgressCalculation[];
  printEtaCalculation: PrintEtaCalculation[];
  enableDiagnostics: boolean;
  thumbnailSize: number;
  colorPickerValueRange: ColorPickerValueRange;
}

export type ToolheadControlStyle = 'cross' | 'bars' | 'circle'

export type TextSortOrder = 'default' | 'numeric-prefix' | 'version'

export type CameraFullscreenAction = 'embed' | 'rawstream';

export type PrintInProgressLayout = 'default' | 'compact'

export type ColorPickerValueRange = 'absolute' | 'percentage'

export type PrintProgressCalculation = 'file' | 'fileAbsolute' | 'slicer' | 'filament'

export type PrintEtaCalculation = 'file' | 'slicer'

// Config stored in moonraker db
export interface ThemeConfig {
  color: string;
  isDark: boolean;
  logo: ThemeLogo;
  backgroundLogo: boolean;
}

// Config defined in host
export interface ThemePreset {
  name: string;
  color: string;
  isDark: boolean;
  logo: ThemeLogo;
}

export interface ThemeLogo {
  src: string;
  dark?: string;
  light?: string;
}

export type RestoreViewState = 'never' | 'session' | 'local'

export interface EditorConfig {
  confirmDirtyEditorClose: boolean;
  autoEditExtensions: string[];
  restoreViewState: RestoreViewState,
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
  drawOrigin: boolean;
  drawBackground: boolean;
  showAnimations: boolean;
  minLayerHeight: number;
  autoLoadOnPrintStart: boolean;
  autoLoadMobileOnPrintStart: boolean;
  autoFollowOnFileLoad: boolean;
  hideSinglePartBoundingBox: boolean;
  autoZoom: boolean;
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
}

export interface FileSystemConfig {
  activeFilters: Record<string, FileFilterType[]>;
  sortBy: Record<string, string | null>;
  sortDesc: Record<string, boolean | null>;
}
