// Written by `@/util/chart-buffer`; live samples are [offset, offset + count).
export interface ChartBuffer {
  time: Float64Array;
  columns: Map<string, Float64Array>;
  offset: number;
  count: number;
  retention: number;
  revision: number;
}

// ECharts' "keyed columns" `dataset.source` - a Float64Array subarray fits.
export type ChartDataSource = Record<string, ArrayLike<number>>

export interface ChartSample {
  time: number;
  values: Readonly<Record<string, number>>;
}

export interface ChartState {
  ready: boolean;
  thermal: ChartBuffer;
  klipper: ChartBuffer;
  memory: ChartBuffer;
  moonraker: ChartBuffer;
  diagnostics: ChartBuffer;
  mcus: Record<string, ChartBuffer>;
  sensors: Record<string, ChartBuffer>;
  selectedLegends: ChartSelectedLegends;
}

export interface ChartSelectedLegends {
  [key: string]: boolean;
}

export type ChartEntryPayload =
  | {
    bucket: 'thermal' | 'klipper' | 'memory' | 'moonraker' | 'diagnostics';
    retention: number;
  } & ChartSample
  | {
    bucket: 'mcu' | 'sensor';
    id: string;
    retention: number;
  } & ChartSample

// Only `selectedLegends` is ever persisted to this DB document.
export interface ChartsDbDocument {
  selectedLegends?: ChartSelectedLegends;
}
