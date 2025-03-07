export interface MeshState {
  range: number;
  wireframe: boolean;
  scale: number;
  boxScale: number;
  flatSurface: boolean;
  matrix: MatrixType;
}

export type MatrixType = 'probed_matrix' | 'mesh_matrix'

export interface BedMeshProfileListEntry {
  name: string;
  active: boolean;
  adaptive: boolean;
  range: number;
}

export interface AppMeshes {
  [index: string]: ProcessedMesh;
}

export interface ProcessedMesh {
  coordinates: MeshCoordinates[];
  dimensions: [number, number];
  range: number;
  min: number;
  mid: number;
  max: number;
}

export interface MeshCoordinates {
  name: string;
  value: number[];
}
