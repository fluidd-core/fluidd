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

export interface TimeEstimates {
  type: 'file' | 'slicer' | 'filament' | 'totals';
  progress: string;
  remaining: string;
  current: string;
  total: string;
}

export interface Heater {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  temperature: number;
  target: number;
  power: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface Fan {
  config: FanConfig;
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  controllable: boolean;
  speed?: number;
  rpm?: number | null;
  temperature?: number;
  target?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface FanConfig {
  [index: string]: string | undefined;
  pin: string;
}

export interface OutputPin {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  controllable: boolean;
  pwm: boolean;
  scale: number;
  static: number;
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
