import type { GetterTree } from 'vuex'
import type {
  MeshState,
  AppMeshes,
  BedMeshProfileListEntry
} from './types'
import type { RootState } from '../types'
import { transformMesh } from '@/util/transform-mesh'

export const getters = {

  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state, getters, rootState, rootGetters) => {
    const printerSettings: Klipper.SettingsState = rootGetters['printer/getPrinterSettings']

    return printerSettings.bed_mesh != null
  },

  getLegacyBedMeshProfiles: (state, getters, rootState, rootGetters) => {
    const klipperProfiles: Record<string, Klipper.BedMeshProfileState> = {}

    const config: Klipper.ConfigState = rootGetters['printer/getPrinterConfig']
    const meshProfileKeys = Object.keys(config)
      .filter(key => key.startsWith('bed_mesh '))

    for (const key of meshProfileKeys) {
      const name = key.substring(9)
      const legacyKlipperProfile = config[key]

      if (legacyKlipperProfile == null) {
        continue
      }

      const profile: Klipper.BedMeshProfileState = {
        points: (legacyKlipperProfile.points ?? '').split('\n')
          .filter(x => x.length)
          .map(x => x.split(',').map(Number)),
        mesh_params: {
          algo: legacyKlipperProfile.algo ?? '',
          max_x: +(legacyKlipperProfile.max_x ?? 0),
          max_y: +(legacyKlipperProfile.max_y ?? 0),
          mesh_x_pps: +(legacyKlipperProfile.mesh_x_pps ?? 0),
          mesh_y_pps: +(legacyKlipperProfile.mesh_y_pps ?? 0),
          min_x: +(legacyKlipperProfile.min_x ?? 0),
          min_y: +(legacyKlipperProfile.min_y ?? 0),
          tension: +(legacyKlipperProfile.tension ?? 0),
          x_count: +(legacyKlipperProfile.x_count ?? 0),
          y_count: +(legacyKlipperProfile.y_count ?? 0)
        }
      }

      klipperProfiles[name] = profile
    }

    return klipperProfiles
  },

  getBedMeshProfiles: (state, getters, rootState): BedMeshProfileListEntry[] => {
    const profiles: BedMeshProfileListEntry[] = []
    const bedMesh = rootState.printer.printer.bed_mesh

    if (bedMesh == null) {
      return []
    }

    const klipperProfiles: Record<string, Klipper.BedMeshProfileState> = bedMesh.profiles ?? getters.getLegacyBedMeshProfiles

    for (const [name, profile] of Object.entries(klipperProfiles)) {
      const points = profile.points.flatMap(x => x)
      const min = Math.min(...points)
      const max = Math.max(...points)

      profiles.push({
        name,
        active: name === bedMesh.profile_name,
        adaptive: false,
        range: Math.abs(min - max)
      })
    }

    if (bedMesh.profile_name && !(bedMesh.profile_name in klipperProfiles)) {
      const min = Math.min(...(bedMesh.mesh_matrix?.flat() ?? [0]))
      const max = Math.max(...(bedMesh.mesh_matrix?.flat() ?? [0]))

      profiles.push({
        name: bedMesh.profile_name,
        active: true,
        adaptive: true,
        range: max - min
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
    const bedMesh = rootState.printer.printer.bed_mesh

    if (bedMesh == null) {
      return {}
    }

    return {
      mesh_matrix: transformMesh(bedMesh, 'mesh_matrix'),
      probed_matrix: transformMesh(bedMesh, 'probed_matrix'),
      mesh_matrix_flat: transformMesh(bedMesh, 'mesh_matrix', true),
      probed_matrix_flat: transformMesh(bedMesh, 'probed_matrix', true)
    }
  }
} satisfies GetterTree<MeshState, RootState>
