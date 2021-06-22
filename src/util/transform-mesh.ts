import { KlipperMesh, ProcessedMesh } from '@/store/mesh/types'

export const transformMesh = (mesh: KlipperMesh, meshMatrix: string, makeFlat = false): ProcessedMesh => {
  const bed_mesh = mesh
  const matrix = bed_mesh[meshMatrix] as number[][]
  const coordinates = []
  let min = 0
  let mid = 0
  let max = 0
  let variance = 0

  if (
    matrix &&
    matrix.length >= 3 &&
    matrix[0] &&
    matrix[0].length >= 3 &&
    bed_mesh.mesh_min &&
    bed_mesh.mesh_max
  ) {
    const x_distance = (bed_mesh.mesh_max[0] - bed_mesh.mesh_min[0]) / (matrix[0].length - 1)
    const y_distance = (bed_mesh.mesh_max[1] - bed_mesh.mesh_min[1]) / (matrix.length - 1)
    let x_idx = 0
    let y_idx = 0

    min = Math.min(...matrix.map(row => Math.min(...row)))
    max = Math.max(...matrix.map(row => Math.max(...row)))
    if (min <= 0 && max >= 0) {
      mid = 0
    } else {
      mid = (max + min) / 2
    }
    variance = Math.abs(min - max)

    for (const x_axis of matrix) {
      x_idx = 0
      const y_coord = bed_mesh.mesh_min[1] + (y_idx * y_distance)
      for (const z_coord of x_axis) {
        const x_coord = bed_mesh.mesh_min[0] + (x_idx * x_distance)
        x_idx++
        coordinates.push(
          {
            name: `x${x_idx}_y${y_idx}`,
            value: [
              x_coord,
              y_coord,
              (makeFlat) ? mid : z_coord
            ]
          }
        )
      }
      y_idx++
    }
  }

  return {
    coordinates,
    min,
    mid,
    max,
    variance
  }
}
