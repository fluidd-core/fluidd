export interface MeshState {
  variance: number;
  wireframe: boolean;
  scale: boolean;
  flatSurface: boolean;
  matrix: 'probed_matrix' | 'mesh_matrix';
}

export interface KlipperMesh {
  [index: string]: string | boolean | number[] | number[][] | undefined;
  profile_name: string;
  active: boolean;
  markedForRemoval?: boolean;
  markedForSave?: boolean;
  mesh_max?: number[];
  mesh_min?: number[];
  mesh_matrix?: number[][];
  probed_matrix?: number[][];
}

export interface AppMeshes {
  [index: string]: ProcessedMesh;
}

export interface ProcessedMesh {
  coordinates: MeshCoordinates[];
  variance: number;
  min: number;
  max: number;
}

export interface MeshCoordinates {
  name: string;
  value: number[];
}
