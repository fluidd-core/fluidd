import type { ChartBuffer } from '@/util/chart-buffer'
import type { ThermalColumn } from './thermal-columns'

export interface ChartSample {
  time: number;
  values: Readonly<Record<string, number>>;
}

export type KlipperChartColumn = 'load' | 'cputime_change'
export type MemoryChartColumn = 'memused'
export type MoonrakerChartColumn = 'load'
export type McuChartColumn = 'load' | 'awake' | 'bw'

export interface ChartState {
  ready: boolean;
  thermal: ChartBuffer<ThermalColumn>;
  klipper: ChartBuffer<KlipperChartColumn>;
  memory: ChartBuffer<MemoryChartColumn>;
  moonraker: ChartBuffer<MoonrakerChartColumn>;
  // Collector / sensor field names - runtime data, so not a literal union.
  diagnostics: ChartBuffer;
  mcus: Record<string, ChartBuffer<McuChartColumn>>;
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
