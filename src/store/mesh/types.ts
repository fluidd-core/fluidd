export interface MeshState {
  variance: number;
  wireframe: boolean;
  scale: number;
  boxScale: number;
  flatSurface: boolean;
  matrix: MatrixType;
}

export type MatrixType = 'probed_matrix' | 'mesh_matrix'

export interface KlipperBedMesh {
  profile_name: string;
  mesh_min?: number[];
  mesh_max?: number[];
  probed_matrix?: number[][];
  mesh_matrix?: number[][];
  profiles: Record<string, KlipperBedMeshProfile>
}

export interface KlipperBedMeshProfile {
  points: number[][]
  mesh_params: KlipperBedMeshProfileMeshParams
}

export interface KlipperBedMeshProfileMeshParams {
  algo: string;
  max_x: number;
  max_y: number;
  mesh_x_pps: number;
  mesh_y_pps: number;
  min_x: number;
  min_y: number;
  tension: number;
  x_count: number;
  y_count: number;
}

export interface BedMeshProfile extends KlipperBedMeshProfile {
  name: string;
  active: boolean;
  min: number;
  max: number,
  variance: number;
}

export interface AppMeshes {
  [index: string]: ProcessedMesh;
}

export interface ProcessedMesh {
  coordinates: MeshCoordinates[];
  variance: number;
  min: number;
  mid: number;
  max: number;
}

export interface MeshCoordinates {
  name: string;
  value: number[];
}
