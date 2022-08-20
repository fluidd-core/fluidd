import { ActionTree } from 'vuex'
import { CamerasState, CameraConfigWithoutId, CameraConfig, CameraService, LegacyCamerasState, LegacyCameraType } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import httpClient from '@/api/httpClient'
import { Globals } from '@/globals'
import { v4 as uuidv4 } from 'uuid'

export const actions: ActionTree<CamerasState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async migrateLegacyCameras (_, payload: LegacyCamerasState) {
    if (payload.cameras) {
      const setQueryParam = (url: string, key: string, value: string) => {
        const fakeOrigin = 'http://fake.fake'
        const newUrl = new URL(url, fakeOrigin)

        newUrl.searchParams.set(key, value)

        return newUrl.origin === fakeOrigin
          ? newUrl.pathname + newUrl.search
          : newUrl.href
      }

      const getCameraServiceForLegacyCameraType = (type: LegacyCameraType): CameraService => {
        switch (type) {
          case 'mjpgstream':
            return 'mjpegstreamer'
          case 'mjpgadaptive':
            return 'mjpegstreamer-adaptive'
          default:
            return type
        }
      }

      const webcams = {} as Record<string, CameraConfigWithoutId>

      for (const camera of payload.cameras) {
        const service = getCameraServiceForLegacyCameraType(camera.type)
        const isMjpegStreamer = service === 'mjpegstreamer' || service === 'mjpegstreamer-adaptive'

        webcams[camera.id] = {
          name: camera.name,
          service,
          targetFps: camera.fpstarget,
          urlStream: isMjpegStreamer ? setQueryParam(camera.url, 'action', 'stream') : camera.url,
          urlSnapshot: isMjpegStreamer ? setQueryParam(camera.url, 'action', 'snapshot') : camera.url,
          flipX: camera.flipX,
          flipY: camera.flipY,
          rotation: camera.rotate ? +camera.rotate : 0,
          enabled: camera.enabled,
          height: camera.height,
          targetFpsIdle: camera.fpsidletarget
        }
      }

      await httpClient.post(`/server/database/item?namespace=${Globals.MOONRAKER_DB.webcams.NAMESPACE}`, {
        value: webcams
      })

      // await httpClient.post(`/server/database/item?namespace=${Globals.MOONRAKER_DB.webcams.NAMESPACE}`, {
      //   key: 'activeCamera',
      //   value: payload.activeCamera
      // })
    }

    await httpClient.delete(`/server/database/item?namespace=${Globals.MOONRAKER_DB.fluidd.NAMESPACE}&key=${Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name}`)
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
  async removeCamera ({ commit }, payload: CameraConfig) {
    commit('setRemoveCamera', payload)

    const { id, ...camera } = payload

    SocketActions.serverWrite(id, camera, Globals.MOONRAKER_DB.webcams.NAMESPACE)

    // SocketActions.serverWrite('webcams.activeCamera', state.activeCamera)
  },

  /**
   * Sets active camera
   */
  async updateActiveCamera ({ commit }, payload: string) {
    commit('setActiveCamera', payload)
    // SocketActions.serverWrite('webcams.activeCamera', payload)
  }
}
