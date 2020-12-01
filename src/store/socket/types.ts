export interface SocketState {
  [key: string]: boolean | SocketError | EndStops | Macros | ConsoleEntry[] | ChartDataSet[] | string | string[] | Printer | null;
  open: boolean;
  connecting: boolean; // if the socket is down, are we still attempting to reconnect?
  ready: boolean;
  acceptingNotifications: boolean;
  error: SocketError | null;
  waits: string[]; // list of things that we might be waiting on, like a gcode script to finish
  endstops: EndStops;
  macros: Macros;
  plugins: string[]; // active plugins (device_power)
  console: ConsoleEntry[]; // console stream
  chart: ChartDataSet[]; // chart data
  printer: Printer;
}

export interface Printer {
  [key: string]: any;
}

export interface Macros {
  [key: string]: Macro;
}

export interface Macro {
  name: string;
  visible: boolean;
}

export interface SocketError {
    code: number;
    message: string;
}

export interface TimeEstimates {
  type: 'file' | 'slicer' | 'filament' | 'totals';
  progress: string;
  timeLeft: string;
  duration: string;
  totalDuration: string;
}

export interface Endstops {
  [key: string]: string;
}

export interface Heater {
  name: string;
  temperature: number;
  target: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface Fan {
  name: string;
  prettyName: string;
  type: string;
  controllable: boolean;
  speed?: number;
  temperature?: number;
  target?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface Sensor {
  name: string;
  type: string;
  temperature: number;
  target?: number;
  measured_min_temp?: number;
  measured_max_temp?: number;
  maxTemp?: number;
  minTemp?: number;
}

export interface Chart {
  labels: {}[]; // Filled by chartjs
  datasets: ChartDataSet[];
}

export interface ChartDataSet {
  data: ChartData[];
  label: string;
  display?: boolean;
  radius?: number;
  spanGaps?: boolean;
  borderWidth?: number;
  fill?: boolean;
  borderColor?: string;
  backgroundColor?: string;
}

export interface ChartData {
  x: Date;
  y: number;
}

export interface EndStops {
  [key: string]: 'TRIGGERED' | 'open';
}

export interface RunoutSensor {
  name: string;
  enabled: boolean;
  filament_detected: boolean;
}

export interface BedMesh {
  profile_name: string;
  active: boolean;
  markedForRemoval?: boolean;
  markedForSave?: boolean;
  mesh_max?: number[];
  mesh_min?: number[];
  mesh_matrix?: number[][];
  probed_matrix?: number[][];
}

export interface BedMeshProfile {
  algo: string;
  max_x: string;
  max_y: string;
  mesh_x_pps: string;
  mesh_y_pps: string;
  min_x: string;
  min_y: string;
  points: string;
  tension: string;
  version: string;
  x_count: string;
  y_count: string;
}

export interface ConsoleEntry {
  message: string;
  time?: number;
}
