import type { MeshState } from './types'

export const state = (): MeshState => {
  return {
    range: 0,
    wireframe: false,
    scale: 0.2,
    boxScale: 2.0,
    flatSurface: false,
    matrix: 'mesh_matrix'
  }
}
