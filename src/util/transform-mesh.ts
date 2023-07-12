import { KlipperBedMesh, ProcessedMesh } from '@/store/mesh/types'

export const transformMesh = (bedMesh: KlipperBedMesh, meshMatrix: keyof KlipperBedMesh, makeFlat = false): ProcessedMesh => {
  const matrix = bedMesh[meshMatrix] as number[][]
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
    bedMesh.mesh_min &&
    bedMesh.mesh_max
  ) {
    const x_distance = (bedMesh.mesh_max[0] - bedMesh.mesh_min[0]) / (matrix[0].length - 1)
    const y_distance = (bedMesh.mesh_max[1] - bedMesh.mesh_min[1]) / (matrix.length - 1)
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
      const y_coord = bedMesh.mesh_min[1] + (y_idx * y_distance)
      for (const z_coord of x_axis) {
        const x_coord = bedMesh.mesh_min[0] + (x_idx * x_distance)
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
