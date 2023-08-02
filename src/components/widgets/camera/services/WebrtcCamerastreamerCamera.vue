<template>
  <video
    ref="streamingElement"
    autoplay
    muted
    :style="cameraStyle"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import consola from 'consola'
import CameraMixin from '@/mixins/camera'

@Component({})
export default class WebrtcCamerastreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  remoteId: string | null = null

  startPlayback () {
    const url = this.buildAbsoluteUrl(this.camera.urlStream || '')

    this.pc?.close()

    fetch(url, {
      body: JSON.stringify({
        type: 'request'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then(response => response.json())
      .then((answer: RTCSessionDescriptionInit) => {
        this.remoteId = 'id' in answer && typeof (answer.id) === 'string' ? answer.id : null

        const config = {
          sdpSemantics: 'unified-plan'
        } as RTCConfiguration

        if ('iceServers' in answer && Array.isArray(answer.iceServers)) {
          config.iceServers = answer.iceServers
        }

        this.pc = new RTCPeerConnection(config)

        this.pc.addTransceiver('video', {
          direction: 'recvonly'
        })

        this.pc.ontrack = (evt: RTCTrackEvent) => {
          if (evt.track.kind === 'video') {
            this.cameraVideo.srcObject = evt.streams[0]
          }
        }

        this.pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
          if (e.candidate) {
            return fetch(url, {
              body: JSON.stringify({
                type: 'remote_candidate',
                id: this.remoteId,
                candidates: [e.candidate]
              }),
              headers: {
                'Content-Type': 'application/json'
              },
              method: 'POST'
            })
              .catch(e => consola.error('[WebrtcCamerastreamerCamera] onicecandidate', e))
          }
        }

        return this.pc?.setRemoteDescription(answer)
      })
      .then(() => this.pc?.createAnswer())
      .then(answer => this.pc?.setLocalDescription(answer))
      .then(() => {
        const offer = this.pc?.localDescription

        return fetch(url, {
          body: JSON.stringify({
            type: offer?.type,
            id: this.remoteId,
            sdp: offer?.sdp
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST'
        })
      })
      .then(response => response.json())
      .catch(e => consola.error('[WebrtcCamerastreamerCamera] setUrl', e))
  }

  stopPlayback () {
    this.pc?.close()
    this.pc = null
    this.cameraVideo.src = ''
  }
}
</script>
