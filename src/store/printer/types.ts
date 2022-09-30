export interface PrinterState {
  printer: Printer;
}

export interface Printer {
  [key: string]: any;
}

export interface Extruder {
  name: string;
  key: string;
}

export interface MCU {
  name: string;
  last_stats: MCUData;
  mcu_build_versions: string;
  mcu_constants: MCUData;
  mcu_version: string;
}

export interface MCUData {
  [index: string]: string | number;
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
  minTemp?: number;
  maxTemp?: number;
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
}

export interface OutputPinConfig {
  [index: string]: string | undefined;
  pwm?: string;
  static_value?: string;
  value?: string;
  shutdown_value?: string;
  cycle_time?: string;
  hardware_pwm?: string;
  scale?: string;
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
