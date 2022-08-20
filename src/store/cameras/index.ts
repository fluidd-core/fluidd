import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { CamerasState } from './types'
import { RootState } from '../types'
import { v4 as uuidv4 } from 'uuid'

export const defaultState = (): CamerasState => {
  return {
    activeCamera: 'all',
    cameras: [
      {
        id: uuidv4(),
        enabled: false,
        name: 'Default',
        service: 'mjpgadaptive',
        targetFps: 15,
        targetFpsIdle: 5,
        urlStream: '/webcam/?action=stream',
        flipX: false,
        flipY: false,
        rotation: 0,
        height: 720
      }
    ]
  }
}

export const state = defaultState()

const namespaced = true

export const cameras: Module<CamerasState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
