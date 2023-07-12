import { ActionTree } from 'vuex'
import { CamerasState, CameraConfigWithoutId, CameraConfig, CameraService, LegacyCamerasState, LegacyCameraType, MoonrakerWebcamRotation } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { v4 as uuidv4 } from 'uuid'
import setUrlQueryParam from '@/util/set-url-query-param'
import { httpClientActions } from '@/api/httpClientActions'

const legacyCameraTypeToCameraService: Record<LegacyCameraType, CameraService> = {
  mjpgstream: 'mjpegstreamer',
  mjpgadaptive: 'mjpegstreamer-adaptive',
  iframe: 'iframe',
  ipstream: 'ipstream'
}

const mjpegstreamerServices: CameraService[] = [
  'mjpegstreamer',
  'mjpegstreamer-adaptive'
]

export const actions: ActionTree<CamerasState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async initLegacyCameras ({ commit }, payload: LegacyCamerasState) {
    const { cameras: legacyCameras, activeCamera } = payload

    if (legacyCameras) {
      for (const legacyCamera of legacyCameras) {
        const service = legacyCameraTypeToCameraService[legacyCamera.type]
        const isMjpegStreamer = mjpegstreamerServices.includes(service)

        const camera: CameraConfigWithoutId = {
          name: legacyCamera.name,
          service,
          enabled: legacyCamera.enabled,
          targetFps: legacyCamera.fpstarget,
          targetFpsIdle: legacyCamera.fpsidletarget,
          urlStream: isMjpegStreamer ? setUrlQueryParam(legacyCamera.url, 'action', 'stream') : legacyCamera.url,
          urlSnapshot: isMjpegStreamer ? setUrlQueryParam(legacyCamera.url, 'action', 'snapshot') : legacyCamera.url,
          flipX: legacyCamera.flipX,
          flipY: legacyCamera.flipY,
          rotation: legacyCamera.rotate ? +legacyCamera.rotate as MoonrakerWebcamRotation : 0
        }

        await httpClientActions.serverDatabaseItemPost(Globals.MOONRAKER_DB.webcams.NAMESPACE, legacyCamera.id, camera)
      }

      await httpClientActions.serverDatabaseItemPost(Globals.MOONRAKER_DB.fluidd.NAMESPACE, Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name, {
        activeCamera: activeCamera || 'all'
      })
    }

    commit('setActiveCamera', activeCamera || 'all')
  },

  /**
   * Init any file configs we may have.
   */
  async initCameras ({ commit }, payload: Record<string, CameraConfigWithoutId>) {
    const cameras = Object.entries(payload)
      .map(([id, value]): CameraConfig => {
        // Cameras created by Fluidd will provide `enabled`; otherwise,  assume `false`.
        if (value.enabled === undefined) {
          value.enabled = false
        }

        // Moonraker and Fluidd provide `rotation`, but Mainsail has `rotate`, so convert between then if property found.
        if (value.rotation === undefined) {
          if ('rotate' in value) {
            value.rotation = value.rotate as MoonrakerWebcamRotation || 0
            delete value.rotate
          } else {
            value.rotation = 0
          }
        }

        return {
          id,
          ...value
        }
      })

    commit('setInitCameras', { cameras })
  },

  /**
   * Add or update a given camera
   */
  async updateCamera ({ commit }, payload: CameraConfig) {
    if (payload.id === '') {
      payload.id = uuidv4()
    }

    commit('setCamera', payload)

    const { id, ...camera } = payload

    SocketActions.serverWrite(id, camera, Globals.MOONRAKER_DB.webcams.NAMESPACE)
  },

  /**
   * Remove a camera
   */
  async removeCamera ({ commit, state }, payload: CameraConfig) {
    commit('setRemoveCamera', payload)

    const { id } = payload

    SocketActions.serverDelete(id, Globals.MOONRAKER_DB.webcams.NAMESPACE)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name + '.activeCamera', state.activeCamera)
  },

  /**
   * Sets active camera
   */
  async updateActiveCamera ({ commit, state }, payload: string) {
    commit('setActiveCamera', payload || 'all')

    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name + '.activeCamera', state.activeCamera)
  },

  async reloadMoonrakerWebcamsNamespace () {
    SocketActions.serverRead(undefined, Globals.MOONRAKER_DB.webcams.NAMESPACE)
  }
}
