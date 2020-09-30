export interface SocketState {
  open: boolean;
  error: SocketError | null;
  waits: string[]; // list of things that we might be waiting on, like a gcode script to finish.
  macros: Macros;
  console: string[]; // console stream.
  chart: ChartDataSet[]; // chart data
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
  minTemp: number;
  maxTemp: number;
}

export interface Fan {
  name: string;
  minTemp: number;
  maxTemp: number;
}

export interface Sensor {
  name: string;
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
