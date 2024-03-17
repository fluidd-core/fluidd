import type { ActionTree } from 'vuex'
import type { WebcamsState, WebcamConfig, WebcamService, WebcamRotation, LegacyCamerasState, LegacyCameraType, DatabaseWebcamConfig } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import setUrlQueryParam from '@/util/set-url-query-param'
import { httpClientActions } from '@/api/httpClientActions'
import { Globals } from '@/globals'

const legacyCameraTypeToWebcamService: Record<LegacyCameraType, WebcamService> = {
  mjpgstream: 'mjpegstreamer',
  mjpgadaptive: 'mjpegstreamer-adaptive',
  iframe: 'iframe',
  ipstream: 'ipstream'
}

const mjpegstreamerServices: WebcamService[] = [
  'mjpegstreamer',
  'mjpegstreamer-adaptive'
]

export const actions: ActionTree<WebcamsState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverWebcamsList()
  },

  async initWebcams ({ commit }, payload) {
    commit('setInitWebcams', payload)
  },

  async initLegacyCameras (_, payload: LegacyCamerasState) {
    if (payload.cameras) {
      for (const legacyCamera of payload.cameras) {
        const service = legacyCameraTypeToWebcamService[legacyCamera.type]
        const isMjpegStreamer = mjpegstreamerServices.includes(service)

        const webcam: DatabaseWebcamConfig = {
          name: legacyCamera.name,
          location: 'printer',
          service,
          icon: 'mdiWebcam',
          enabled: legacyCamera.enabled ?? true,
          targetFps: legacyCamera.fpstarget || 15,
          targetFpsIdle: legacyCamera.fpsidletarget || 5,
          urlStream: isMjpegStreamer && legacyCamera.url ? setUrlQueryParam(legacyCamera.url, 'action', 'stream') : legacyCamera.url,
          urlSnapshot: isMjpegStreamer && legacyCamera.url ? setUrlQueryParam(legacyCamera.url, 'action', 'snapshot') : legacyCamera.url,
          flipX: legacyCamera.flipX ?? false,
          flipY: legacyCamera.flipY ?? false,
          rotation: legacyCamera.rotate ? +legacyCamera.rotate as WebcamRotation : 0,
          aspectRatio: '4:3',
          extraData: {}
        }

        await httpClientActions.serverDatabaseItemPost(Globals.MOONRAKER_DB.webcams.NAMESPACE, legacyCamera.id, webcam)
      }

      await httpClientActions.serverDatabaseItemDelete(Globals.MOONRAKER_DB.fluidd.NAMESPACE, Globals.MOONRAKER_DB.fluidd.ROOTS.cameras.name)
    }
  },

  async updateWebcam ({ commit }, payload: WebcamConfig) {
    commit('setUpdateWebcam', payload)

    SocketActions.serverWebcamsWrite(payload)
  },

  async removeWebcam ({ commit }, payload: string) {
    commit('setRemoveWebcam', payload)

    SocketActions.serverWebcamsDelete(payload)
  },

  async updateActiveWebcam ({ commit, state }, payload: string) {
    commit('setActiveWebcam', payload)

    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.webcams.name + '.activeWebcam', state.activeWebcam)
  },

  async onWebcamsList ({ commit }, payload: { webcams: WebcamConfig[] }) {
    if (payload) {
      commit('setWebcamsList', payload)
    }
  },

  async onWebcamsChanged ({ commit }, payload: { webcams: WebcamConfig[] }) {
    if (payload) {
      commit('setWebcamsList', payload)
    }
  }
}
