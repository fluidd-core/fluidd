export interface SocketState {
  [key: string]: any;
  open: boolean;
  connecting: boolean; // if the socket is down, are we still attempting to reconnect?
  acceptingNotifications: boolean;
  error: SocketError | null;
  waits: string[]; // list of things that we might be waiting on, like a gcode script to finish.
  endstops: EndStops;
  macros: Macros;
  console: string[]; // console stream.
  chart: ChartDataSet[]; // chart data
  temperature_fans: string[]; // maintains a list of available temp fans
  temperature_sensors: string[]; // maintains a list of available sensors
  temperature_probes: string[]; // maintains a list of available probes
  heater_fans: string[]; // maintains a list of available heater fans
  filament_switch_sensors: string[]; // maintains a list of available filament switch sensors
  output_pins: string[]; // maintains a list of available output pins
  printer: any;
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

export interface FileChangeSocketResponse {
  item: FileChangeItem;
  source_item?: FileChangeItem;
}

export interface FileChangeItem {
  root: string;
  path: string;
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
  temperature?: number;
  target?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface Sensor {
  name: string;
  temperature: number;
  target?: number;
  minMeasuredTemp?: number;
  maxMeasuredTemp?: number;
}

export interface Chart {
  labels: {}[]; // Filled by chartjs
  datasets: ChartDataSet[];
}

export interface ChartDataSet {
  data: ChartData[];
  label: string;
  display?: boolean;
  radius: number;
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

export interface Thumbnail {
  data: string;
  height: number;
  width: number;
  size: number;
}
