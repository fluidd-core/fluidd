import type { CamerasState } from './types'
import { v4 as uuidv4 } from 'uuid'

export const defaultState = (): CamerasState => {
  return {
    activeCamera: 'all',
    cameras: [
      {
        id: uuidv4(),
        enabled: false,
        name: 'Default',
        service: 'mjpegstreamer-adaptive',
        targetFps: 15,
        targetFpsIdle: 5,
        urlStream: '/webcam/?action=stream',
        urlSnapshot: '/webcam/?action=snapshot',
        flipX: false,
        flipY: false,
        rotation: 0,
        aspectRatio: '16:9'
      }
    ]
  }
}

export const state = defaultState()
