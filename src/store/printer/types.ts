import type { Globals } from '@/globals'

export interface PrinterState {
  info: PrinterInfo;
  manualProbeDialogOpen: boolean;
  bedScrewsAdjustDialogOpen: boolean;
  screwsTiltAdjustDialogOpen: boolean;
  forceMoveEnabled: boolean;
  printer: Record<string, any>;
}

export interface PrinterInfo {
  state: string;
  state_message: string;
  hostname?: string;
  klipper_path?: string;
  python_path?: string;
  process_id?: number;
  user_id?: number;
  group_id?: number;
  log_file?: string;
  config_file?: string;
  software_version?: string;
  cpu_info?: string
  app?: string;
}

export interface KnownExtruder {
  name: string;
  key: string;
}

export interface Extruder {
  config: ExtruderConfig
  temperature: number;
  target: number;
  power: number;
  can_extrude: boolean;
  min_extrude_temp: number;
  pressure_advance?: number;
  smooth_time?: number;
}

export interface ExtruderConfig {
  nozzle_diameter: number;
  filament_diameter: number;
  min_extrude_temp: number;
  max_extrude_only_distance: number;
  max_extrude_only_velocity: number;
  pressure_advance?: number;
  pressure_advance_smooth_time?: number;
}

export interface ExtruderStepper extends StepperType<ExtruderStepperConfig> {
  motion_queue?: string | null;
  pressure_advance?: number;
  smooth_time?: number;
}

export interface ExtruderStepperConfig {
  extruder?: string;
  pressure_advance?: number;
  pressure_advance_smooth_time?: number;
}

export interface Stepper extends StepperType {}

export type StepperType<T = Record<string, any>> = {
  config: T;
  name: string;
  prettyName: string;
  key: string;
  enabled?: boolean;
}

export interface MCU {
  name: string;
  prettyName: string;
  last_stats?: Record<string, string | number>;
  mcu_build_versions?: string;
  mcu_constants?: Record<string, string | number>;
  mcu_version?: string;
  app?: string;
  non_critical_disconnected?: boolean;
  config: Record<string, any>;
}

export type OutputType<T = Record<string, any>> = {
  config: T
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
}
export interface Heater extends OutputType {
  temperature: number;
  target: number;
  power: number;
  minTemp: number;
  maxTemp: number;
}

export interface Fan extends OutputType<FanConfig> {
  controllable: boolean;
  speed?: number;
  rpm?: number | null;
  temperature?: number;
  target?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface FanConfig {
  [key: string]: string | number | undefined;
  pin: string;
  max_power: number;
  off_below: number;
}

export interface Led extends OutputType {
  color?: string;
  color_data: number[][]
}

export interface OutputPin extends OutputType<OutputPinConfig> {
  controllable: boolean;
  pwm: boolean;
  scale: number;
  static: number;
  value: number;
  resetValue: number;
}

export interface OutputPinConfig {
  [index: string]: string | number | boolean | undefined;
  pwm?: boolean;
  static_value?: number;
  value?: number;
  shutdown_value?: number;
  cycle_time?: number;
  hardware_pwm?: boolean;
  scale?: number;
}

export interface Sensor {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  temperature: number;
  pressure?: number;
  humidity?: number;
  gas?: number;
  target?: number;
  measured_min_temp?: number;
  measured_max_temp?: number;
  maxTemp?: number;
  minTemp?: number;
}

export interface RunoutSensor {
  name: string;
  enabled: boolean;
  filament_detected: boolean;
}

export interface Endstop {
  name: string;
  state: string;
}

export interface Probe {
  last_z_result: number;
  last_query: boolean;
  name: ProbeName;
}

export type ProbeName = 'bltouch' | 'smart_effector' | 'probe'

export interface BedScrews {
  key: string;
  name: string;
  prettyName: string;
  fine: number;
  x: number;
  y: number;
}

export interface ScrewsTiltAdjust {
  error: boolean;
  max_deviation?: number | null;
  screws: ScrewsTiltAdjustScrew[]
}

export interface ScrewsTiltAdjustScrew {
  key: string;
  name: string;
  prettyName: string;
  adjustMinutes: number;
  x: number;
  y: number;
  z: number;
  sign: 'CW' | 'CCW';
  adjust: string;
  is_base: boolean;
}

// printer.mcu[num]
export interface KlipperMcu {
  last_stats: KlipperMcuStats;
  mcu_build_versions: string;
  mcu_constraints: KlipperMcuConstraints;
  mcu_version: string;
}

export interface KlipperMcuStats {
  bytes_invalid: number;
  bytes_read: number;
  bytes_retransmit: number;
  bytes_write: number;
  freq: number;
  mcu_awake: number;
  mcu_task_avg: number;
  mcu_task_stddev: number;
  ready_bytes: number;
  receive_seq: number;
  retransmit_seq: number;
  rto: number;
  rttvar: number;
  send_seq: number;
  srtt: number;
  stalled_bytes: number;
}

export interface KlipperMcuConstraints {
  MCU: string;
  CLOCK_FREQ: string;
}

// printers.system_stats
export interface SystemStats {
  cputime: number;
  memavail: number;
  sysload: number;
}

export interface BedSize {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GcodeCommands {
  [key: string]: GcodeCommand
}

export interface GcodeCommand {
  help?: string
}

export interface TimeEstimates {
  progress: number;
  printDuration: number;
  totalDuration: number;
  fileLeft: number;
  slicerLeft: number;
  actualLeft: number;
  eta: number;
}

export interface BeaconState {
  last_sample?: BeaconLastSample | null;
  last_received_sample?: BeaconLastReceivedSample | null;
  last_z_result?: number | null,
  last_probe_position?: [number, number] | null,
  last_probe_result?: number | null,
  last_offset_result?: number | null,
  last_poke_result?: number | null
  model?: string | null;
}

export interface BeaconLastSample {
  time: number;
  value: number;
  temp: number;
  dist?: number | null;
}

export interface BeaconLastReceivedSample {
  temp: number;
  clock: number;
  time: number;
  data: number;
  data_smooth: number;
  freq: number;
}

export interface BeaconModel {
  name: string;
  active: boolean;
}

export type SupportedKlipperServices = keyof typeof Globals.SUPPORTED_SERVICES.KLIPPER

export interface KlippyApp {
  name: SupportedKlipperServices;
  isKalico: boolean;
  isKalicoOrDangerKlipper: boolean;
  domain: string;
  minVersion: string;
}

export interface ExcludeObjectState {
  objects: ExcludeObjectObject[];
  current_object: string | null;
  excluded_objects: string[];
}

export interface ExcludeObjectObject {
  name: string;
  polygon?: [number, number][];
  center?: [number, number] | [number, number, number];
}

export interface ExcludeObjectPart extends ExcludeObjectObject {
  isExcluded: boolean;
  isCurrent: boolean;
}
