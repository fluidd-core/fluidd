import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface GcodePreviewState {
  moves: Move[];
  layers: Layer[];
  parts: Part[];
  tools: number[];
  file: AppFile | AppFileWithMeta | null;
  parserProgress: number;
  parserWorker: Worker | null;
}

export interface LinearMove {
  x?: number;
  y?: number;
  z?: number;
  e?: number;
  tool: number;
  filePosition: number;
}

export interface ArcMove extends LinearMove {
  i?: number;
  j?: number;
  k?: number;
  r?: number;
  d: Rotation;
}

export type Move = LinearMove | ArcMove

export type Rotation = 'clockwise' | 'counter-clockwise'

export type Tool = `T${number}`

export interface LayerPaths {
  moves: string;
  extrusions: Record<Tool, string>;
  retractions: Point[];
  unretractions: Point[];
  toolhead: Point;
  tool: Tool;
}

export interface Point {
  x: number;
  y: number;
}

export interface Point3D extends Point {
  z: number;
}

export type PositioningMode = 'relative' | 'absolute'

export interface Layer {
  move: number;
  z: number;
  filePosition: number;
}

export interface Part {
  polygon: Point[]
}

export interface MinMax {
  min: number;
  max: number;
}

export interface BBox {
  x: MinMax;
  y: MinMax;
}
