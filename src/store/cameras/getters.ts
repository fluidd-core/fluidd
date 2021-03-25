import { GetterTree } from 'vuex'
import { CamerasState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<CamerasState, RootState> = {
  /**
   * Return visible cameras
   */
  getVisibleCameras: (state) => {
    return [...state.cameras]
      .filter(camera => camera.enabled)
      .sort((a, b) => {
        const name1 = a.name.toLowerCase()
        const name2 = b.name.toLowerCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })
  },

  /**
   * Return all cameras
   */
  getCameras: (state) => {
    return [...state.cameras]
      .sort((a, b) => {
        const name1 = a.name.toLowerCase()
        const name2 = b.name.toLowerCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })
  }
}
