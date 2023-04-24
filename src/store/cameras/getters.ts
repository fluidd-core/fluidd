import { GetterTree } from 'vuex'
import { CameraConfig, CameraService, CamerasState, MoonrakerWebcamRotation } from './types'
import { RootState } from '../types'
import { WebcamConfig } from '../webcams/types'

export const getters: GetterTree<CamerasState, RootState> = {
  /**
   * Return all cameras.
   */
  getCameras: (state, getters) => {
    const camerasInConfig = getters.getCamerasInConfig as CameraConfig[]

    return [
      ...state.cameras,
      ...camerasInConfig
    ].sort((a, b) => a.name.localeCompare(b.name))
  },

  getCamerasInConfig: (state, getters, rootState, rootGetters) => {
    const webcamsInConfig = rootGetters['webcams/getWebcamsInConfig'] as WebcamConfig[]

    return webcamsInConfig
      .map((webcam): CameraConfig => ({
        name: webcam.name,
        location: webcam.location,
        service: webcam.service as CameraService,
        enabled: webcam.enabled ?? true,
        icon: webcam.icon,
        targetFps: webcam.target_fps,
        targetFpsIdle: webcam.target_fps_idle,
        urlStream: webcam.stream_url,
        urlSnapshot: webcam.snapshot_url,
        flipX: webcam.flip_horizontal,
        flipY: webcam.flip_vertical,
        rotation: webcam.rotation as MoonrakerWebcamRotation ?? 0,
        aspectRatio: webcam.aspect_ratio,
        extraData: webcam.extra_data,
        source: webcam.source,
        id: `config-${webcam.name}`
      }))
  },

  /**
   * Return all enabled cameras,
   */
  getEnabledCameras: (state, getters) => {
    return [...getters.getCameras]
      .filter(camera => camera.enabled)
  },

  /**
   * Return visible cameras. I.e., return cameras dependent on them being
   * 1. enabled and 2. filtered by the currently active state.
   */
  getVisibleCameras: (state, getters) => {
    if (getters.getActiveCamera === 'all') return [...getters.getEnabledCameras]
    return [...getters.getEnabledCameras]
      .filter(camera => camera.id === getters.getActiveCamera)
  },

  /**
   * Return a camera by its id.
   */
  getCameraById: (state) => (id: string) => {
    return state.cameras.find(camera => camera.id === id)
  },

  /**
   * Return the set active camera, being all or a specific id.
   */
  getActiveCamera: (state) => {
    return state.activeCamera
  }
}
