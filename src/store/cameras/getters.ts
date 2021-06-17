import { GetterTree } from 'vuex'
import { CamerasState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<CamerasState, RootState> = {
  /**
   * Return all cameras.
   */
  getCameras: (state) => {
    return [...state.cameras]
      .sort((a, b) => {
        const name1 = a.name.toLowerCase()
        const name2 = b.name.toLowerCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })
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
