export interface SocketState {
  open: boolean;
  error: SocketError | null;
  waits: string[]; // list of things that we might be waiting on, like a gcode script to finish.
  macros: Macros;
  console: string[]; // console stream.
  chart: ChartItem[]; // chart data
  temperature_fans: string[]; // maintains a list of available temp fans
  temperature_sensors: string[]; // maintains a list of available probes
  heater_fans: string[]; // maintains a list of available heater fans
  printer: any;
}

export interface Macros {
  [key: string]: Macro;
}

export interface Macro {
  name: string;
  visible: boolean;
}

export interface ChartItem {
  label: string;
  data: ChartDataItem[];
  radius: number;
}

export interface ChartDataItem {
  x: Date;
  y: number;
}

export interface SocketError {
    code: number;
    message: string;
}
// export interface Printer {
//   // [key: string]: string[] | PrinterInfo | PrintStats | undefined | {[key: string]: {[key: string]: string} | string };
//   info?: PrinterInfo;
//   objects: string[];
//   macros: string[];
//   print_stats: PrintStats;
//   idle_timeout: IdleTimeout;
// }

// export interface PrintStats {
//   state: string;
// }

// export interface PrinterInfo {
//   config_file: string;
//   cpu_info: string;
//   hostname: string;
//   klipper_path: string;
//   log_file: string;
//   python_path: string;
//   software_version: string;
//   state: string;
// }

export interface TimeEstimates {
  type: 'file' | 'slicer' | 'filament';
  progress: number;
  timeLeft: string;
  duration: string;
  totalDuration: string;
}

export interface FileChangeSocketResponse {
  item: FileChangeItem;
  source_item?: FileChangeItem;
}

export interface FileChangeItem {
  root: string;
  path: string;
}
