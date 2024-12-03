<template>
  <video
    ref="streamingElement"
    autoplay
    playsinline
    muted
    :style="cameraStyle"
    :crossorigin="crossorigin"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import consola from 'consola'
import CameraMixin from '@/mixins/camera'

type RTCConfigurationWithSdpSemantics = RTCConfiguration & {
  sdpSemantics: 'unified-plan'
}

@Component({})
export default class WebrtcCamerastreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  remoteId: string | null = null

  // adapted from https://github.com/ayufan/camera-streamer/blob/4203f89df1596cc349b0260f26bf24a3c446a56b/html/webrtc.html

  async startPlayback () {
    const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

    this.pc?.close()

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }
    ]

    try {
      const response = await fetch(url, {
        body: JSON.stringify({
          type: 'request',
          iceServers,
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })

      const rtcSessionDescriptionInit = await response.json() as RTCSessionDescriptionInit

      this.remoteId = ('id' in rtcSessionDescriptionInit && typeof rtcSessionDescriptionInit.id === 'string')
        ? rtcSessionDescriptionInit.id
        : null

      const config: RTCConfigurationWithSdpSemantics = {
        sdpSemantics: 'unified-plan'
      }

      if ('iceServers' in rtcSessionDescriptionInit && Array.isArray(rtcSessionDescriptionInit.iceServers)) {
        config.iceServers = rtcSessionDescriptionInit.iceServers
      }

      const pc = this.pc = new RTCPeerConnection(config)

      pc.addTransceiver('video', {
        direction: 'recvonly'
      })

      pc.ontrack = (event: RTCTrackEvent) => {
        if (event.track.kind === 'video') {
          this.cameraVideo.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          try {
            await fetch(url, {
              body: JSON.stringify({
                type: 'remote_candidate',
                id: this.remoteId,
                candidates: [event.candidate]
              }),
              headers: {
                'Content-Type': 'application/json'
              },
              method: 'POST'
            })
          } catch (e) {
            consola.error('[WebrtcCamerastreamerCamera] onicecandidate', e)
          }
        }
      }

      await pc.setRemoteDescription(rtcSessionDescriptionInit)

      const rtcLocalSessionDescriptionInit = await pc.createAnswer()

      await pc.setLocalDescription(rtcLocalSessionDescriptionInit)

      const offer = pc.localDescription

      const response2 = await fetch(url, {
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

      await response2.json()
    } catch (e) {
      consola.error('[WebrtcCamerastreamerCamera] startPlayback', e)
    }
  }

  stopPlayback () {
    this.pc?.close()
    this.pc = null
    this.cameraVideo.src = ''
    this.cameraVideo.srcObject = null
  }
}
</script>
