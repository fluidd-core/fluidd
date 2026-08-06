import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface GcodePreviewState {
  moves: MoveStore;
  layers: readonly Layer[];
  parts: readonly Part[];
  tools: readonly number[];
  bounds: Readonly<BBox> | null;
  file: AppFile | AppFileWithMeta | null;
  parserProgress: number;
  parserWorker: Worker | null;
}

export const MoveFlags = {
  Extruding: 1 << 0,
  Retracting: 1 << 1,
  Arc: 1 << 2,
  Clockwise: 1 << 3
} as const

/**
 * Columnar store of parsed moves, transferred from the parser worker.
 *
 * `x`/`y`/`z` are forward-filled absolute positions after each move; `i`/`j` are
 * arc centre offsets relative to the move start, `0` unless the `Arc` flag is set.
 */
export interface MoveStore {
  readonly x: Float32Array<ArrayBuffer>;
  readonly y: Float32Array<ArrayBuffer>;
  readonly z: Float32Array<ArrayBuffer>;
  readonly i: Float32Array<ArrayBuffer>;
  readonly j: Float32Array<ArrayBuffer>;
  readonly tool: Uint8Array<ArrayBuffer>;
  readonly flags: Uint8Array<ArrayBuffer>;
  readonly filePosition: Uint32Array<ArrayBuffer>;
  readonly length: number;
}

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
