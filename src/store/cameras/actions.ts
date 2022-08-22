import { ActionTree } from 'vuex'
import { CamerasState, CameraConfigWithoutId, CameraConfig, CameraService, LegacyCamerasState, LegacyCameraType } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import httpClient from '@/api/httpClient'
import { Globals } from '@/globals'
import { v4 as uuidv4 } from 'uuid'
import setUrlQueryParam from '@/util/set-url-query-param'

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

        const camera = {
          name: legacyCamera.name,
          service,
          targetFps: legacyCamera.fpstarget,
          urlStream: isMjpegStreamer ? setUrlQueryParam(legacyCamera.url, 'action', 'stream') : legacyCamera.url,
          urlSnapshot: isMjpegStreamer ? setUrlQueryParam(legacyCamera.url, 'action', 'snapshot') : legacyCamera.url,
          flipX: legacyCamera.flipX,
          flipY: legacyCamera.flipY,
          rotation: legacyCamera.rotate ? +legacyCamera.rotate : 0,
          enabled: legacyCamera.enabled,
          height: legacyCamera.height,
          targetFpsIdle: legacyCamera.fpsidletarget
        } as CameraConfigWithoutId

        await httpClient.post('/server/database/item', {
          namespace: Globals.MOONRAKER_DB.webcams.NAMESPACE,
          key: legacyCamera.id,
          value: camera
        })
      }

      await httpClient.post('/server/database/item', {
        namespace: Globals.MOONRAKER_DB.fluidd.NAMESPACE,
        key: Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name,
        value: {
          activeCamera: activeCamera || 'all'
        }
      })
    }

    commit('setActiveCamera', activeCamera || 'all')
  },

  /**
   * Init any file configs we may have.
   */
  async initCameras ({ commit }, payload: Record<string, CameraConfigWithoutId>) {
    const cameras = Object.entries(payload).map(([id, value]) => ({
      id,
      ...value
    } as CameraConfig))

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
