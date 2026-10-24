import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface GcodePreviewState {
  moves: Readonly<MoveStore>;
  layers: readonly Layer[];
  parts: readonly Part[];
  tools: readonly number[];
  roles: readonly ExtrusionRole[];
  speedRange: Readonly<MinMax> | null;
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

export const ExtrusionRole = {
  None: 0,
  Perimeter: 1,
  ExternalPerimeter: 2,
  OverhangPerimeter: 3,
  InternalInfill: 4,
  SolidInfill: 5,
  TopSolidInfill: 6,
  Ironing: 7,
  BridgeInfill: 8,
  GapFill: 9,
  Skirt: 10,
  SupportMaterial: 11,
  SupportMaterialInterface: 12,
  WipeTower: 13,
  Custom: 14
} as const

export type ExtrusionRole = typeof ExtrusionRole[keyof typeof ExtrusionRole]

export type ColorMode = 'tool' | 'role' | 'speed'

/**
 * Columnar store of parsed moves, transferred from the parser worker.
 *
 * `x`/`y`/`z` are forward-filled absolute positions after each move.
 *
 * `i`/`j` are arc centre offsets, still indexed by move but truncated after the
 * last `Arc` move, so only read them when that move has the `Arc` flag set.
 *
 * `speed` is in mm/min.
 */
export interface MoveStore {
  readonly x: Float32Array<ArrayBuffer>;
  readonly y: Float32Array<ArrayBuffer>;
  readonly z: Float32Array<ArrayBuffer>;
  readonly i: Float32Array<ArrayBuffer>;
  readonly j: Float32Array<ArrayBuffer>;
  readonly tool: Uint8Array<ArrayBuffer>;
  readonly flags: Uint8Array<ArrayBuffer>;
  readonly role: Uint8Array<ArrayBuffer>;
  readonly speed: Uint16Array<ArrayBuffer>;
  readonly filePosition: Uint32Array<ArrayBuffer>;
  readonly length: number;
}

export type Tool = `T${number}`

export interface LayerPaths {
  moves: string;
  extrusions: Record<string, string>;
  retractions: Point[];
  unretractions: Point[];
  toolhead: Point;
  tool: Tool;
}

export interface BuildLayerPathsOptions {
  includeExtrusions?: boolean;
  includeMoves?: boolean;
  includeRetractions?: boolean;
  includeTools?: boolean;
  colorBy?: ColorMode;
  speedRange?: Readonly<MinMax> | null;
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

export interface SpeedBucket extends MinMax {
  color: string;
}

export interface BBox {
  x: MinMax;
  y: MinMax;
}
