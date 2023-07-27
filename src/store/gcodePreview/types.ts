import { AppFile } from '@/store/files/types'

export type LayerNr = number

export interface GcodePreviewState {
  moves: Move[];
  layers: Layer[],
  parts: Part[],
  file?: AppFile;
  parserProgress: number;
  parserWorker: Worker | null;

  viewer: {
    showCurrentLayer: boolean;
    showNextLayer: boolean;
    showPreviousLayer: boolean;
    showMoves: boolean;
    showExtrusions: boolean;
    showRetractions: boolean;
    showParts: boolean;
    followProgress: boolean;
  };
}

export interface LinearMove {
  x?: number;
  y?: number;
  z?: number;
  e?: number;

  filePosition: number;
}

export interface ArcMove extends LinearMove {
  i?: number;
  j?: number;
  k?: number;
  r?: number;
  direction: Rotation;
}

export type Move = LinearMove | ArcMove;

export type Rotation = 'clockwise' | 'counter-clockwise'

export interface LayerPaths {
  moves: string;
  extrusions: string;
  retractions: Point[];
  extrusionStarts: Point[];
  toolhead: Point;
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

export type ParseGcodeWorkerClientMessage = {
  action: 'progress',
  filePosition: number
} | {
  action: 'result',
  moves: Move[],
  layers: Layer[],
  parts: Part[]
}

export type ParseGcodeWorkerServerMessage = {
  action: 'parse',
  gcode: string
}
