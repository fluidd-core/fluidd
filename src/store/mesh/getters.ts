import { GetterTree } from 'vuex'
import { MeshState, KlipperMesh, AppMeshes } from './types'
import { RootState } from '../types'
import { transformMesh } from '@/util/transform-mesh'

export const getters: GetterTree<MeshState, RootState> = {

  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state, getters, rootState, rootGetters) => {
    return rootGetters['printer/getPrinterSettings']('bed_mesh') !== undefined
  },

  /**
   * Returns all available bed meshes, including those only in memory / currently loaded.
   */
  getBedMeshes: (state, getters, rootState, rootGetters): KlipperMesh[] => {
    const meshes: KlipperMesh[] = []
    const currentProfile = rootState.printer.printer.bed_mesh.profile_name || ''
    const config = rootGetters['printer/getPrinterConfig']()
    if (rootState.printer.printer.bed_mesh && currentProfile.length > 0) {
      meshes.push({
        ...rootState.printer.printer.bed_mesh,
        active: true
      })
    }
    if (config) {
      const meshSettings = Object.keys(config).filter(key => key.startsWith('bed_mesh'))
      for (const key of meshSettings) {
        if (key === 'bed_mesh') continue // The mesh configuration.
        const profile_name = key.split(' ').splice(1).join(' ')
        if (
          profile_name !== currentProfile
        ) {
          const profile: KlipperMesh = {
            profile_name,
            active: false
          }
          meshes.push(profile)
        }
      }
    }
    return meshes.sort((a, b) =>
      a.profile_name === 'default'
        ? -1
        : (
            b.profile_name === 'default'
              ? 1
              : a.profile_name.localeCompare(b.profile_name)
          )
    )
  },

  /**
   * Returns the current mesh, in a usable format for echarts.
   */
  getCurrentMeshData: (state, getters, rootState): AppMeshes => {
    return {
      mesh_matrix: transformMesh(rootState.printer.printer.bed_mesh, 'mesh_matrix'),
      probed_matrix: transformMesh(rootState.printer.printer.bed_mesh, 'probed_matrix'),
      mesh_matrix_flat: transformMesh(rootState.printer.printer.bed_mesh, 'mesh_matrix', true),
      probed_matrix_flat: transformMesh(rootState.printer.printer.bed_mesh, 'probed_matrix', true)
    }
  }
}
