import { GetterTree } from 'vuex'
import { BedMeshProfile, MeshState, AppMeshes, KlipperBedMesh } from './types'
import { RootState } from '../types'
import { transformMesh } from '@/util/transform-mesh'

export const getters: GetterTree<MeshState, RootState> = {

  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state, getters, rootState, rootGetters) => {
    return rootGetters['printer/getPrinterSettings']('bed_mesh') !== undefined
  },

  getBedMeshProfiles: (state, getters, rootState) => {
    const profiles: BedMeshProfile[] = []
    const bedMesh = rootState.printer.printer.bed_mesh as KlipperBedMesh

    for (const [name, profile] of Object.entries(bedMesh.profiles)) {
      const points = profile.points.flatMap(x => x)
      const min = Math.min(...points)
      const max = Math.max(...points)

      profiles.push({
        name,
        active: name === bedMesh.profile_name,
        min,
        max,
        variance: Math.abs(min - max),
        ...profile
      })
    }

    return profiles.sort((a, b) =>
      a.name === 'default'
        ? -1
        : (
            b.name === 'default'
              ? 1
              : a.name.localeCompare(b.name)
          )
    )
  },

  /**
   * Returns the current mesh, in a usable format for echarts.
   */
  getCurrentMeshData: (state, getters, rootState): AppMeshes => {
    const bedMesh = rootState.printer.printer.bed_mesh as KlipperBedMesh

    return {
      mesh_matrix: transformMesh(bedMesh, 'mesh_matrix'),
      probed_matrix: transformMesh(bedMesh, 'probed_matrix'),
      mesh_matrix_flat: transformMesh(bedMesh, 'mesh_matrix', true),
      probed_matrix_flat: transformMesh(bedMesh, 'probed_matrix', true)
    }
  }
}
