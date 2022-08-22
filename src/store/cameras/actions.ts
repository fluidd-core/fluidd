import { ActionTree } from 'vuex'
import { CamerasState, CameraConfigWithoutId, CameraConfig, LegacyCamerasState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import httpClient from '@/api/httpClient'
import { Globals } from '@/globals'
import { v4 as uuidv4 } from 'uuid'
import getCameraServiceForLegacyCameraType from '@/util/get-camera-service-for-legacy-camera-type'
import setUrlQueryParam from '@/util/set-url-query-param'

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
        const service = getCameraServiceForLegacyCameraType(legacyCamera.type)
        const isMjpegStreamer = service === 'mjpegstreamer' || service === 'mjpegstreamer-adaptive'

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
    SocketActions.serverWrite('cameras.activeCamera', state.activeCamera)
  },

  /**
   * Sets active camera
   */
  async updateActiveCamera ({ commit, state }, payload: string) {
    commit('setActiveCamera', payload || 'all')

    SocketActions.serverWrite('cameras.activeCamera', state.activeCamera)
  },

  async onCamerasLoaded ({ dispatch }, payload: { value: Record<string, CameraConfigWithoutId> }) {
    dispatch('initCameras', payload.value)
  }
}
