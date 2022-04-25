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
        type: 'mjpgadaptive',
        fpstarget: 15,
        fpsidletarget: 5,
        url: '/webcam/?action=stream',
        flipX: false,
        flipY: false,
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
