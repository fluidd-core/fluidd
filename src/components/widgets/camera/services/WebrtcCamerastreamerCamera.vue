<template>
  <video
    ref="streamingElement"
    autoplay
    playsinline
    muted
    :style="cameraStyle"
    :crossorigin="crossorigin"
    @play="updateStatus('connected')"
    @error="updateStatus('error')"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import { consola } from 'consola'
import CameraMixin from '@/mixins/camera'
import sleep from '@/util/sleep'

type RTCConfigurationWithSdpSemantics = RTCConfiguration & {
  sdpSemantics: 'unified-plan'
}

@Component({})
export default class WebrtcCamerastreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  remoteId: string | null = null
  playbackAbortController: AbortController | null = null
  sleepAbortController: AbortController | null = null

  // adapted from https://github.com/ayufan/camera-streamer/blob/2d3a4884378f384346680a55196bf9244b99b6b6/html/webrtc.html

  async loadStream () {
    this.pc?.close()

    const abortControllerSignal = this.playbackAbortController?.signal

    if (!abortControllerSignal || abortControllerSignal.aborted) {
      return
    }

    this.updateStatus('connecting')

    const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

    this.updateRawCameraUrl(url.toString())

    try {
      const response = await fetch(url, {
        body: JSON.stringify({
          type: 'request',
          iceServers: [
            {
              urls: [
                'stun:stun.l.google.com:19302'
              ]
            }
          ],
          keepAlive: true
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        signal: abortControllerSignal
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

      pc.ondatachannel = (event: RTCDataChannelEvent) => {
        const dc = event.channel

        if (dc.label === 'keepalive') {
          dc.onmessage = () => {
            dc.send('pong')
          }
        }
      }

      pc.addTransceiver('video', {
        direction: 'recvonly'
      })

      pc.ontrack = (event: RTCTrackEvent) => {
        if (event.track.kind === 'video') {
          this.cameraVideo.srcObject = event.streams[0]
        }
      }

      if (config.iceServers) {
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
                method: 'POST',
                signal: abortControllerSignal
              })
            } catch (e) {
              consola.error('[WebrtcCamerastreamerCamera] onicecandidate', e)
            }
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
        method: 'POST',
        signal: abortControllerSignal
      })

      await response2.json()
    } catch (e) {
      consola.error(`[WebrtcCamerastreamerCamera] failed to start playback "${this.camera.name}"`, e)

      this.onError()
    }
  }

  async onError () {
    this.updateStatus('error')
    this.pc?.close()
    this.pc = null

    const playbackAbortSignal = this.playbackAbortController?.signal

    if (!playbackAbortSignal || playbackAbortSignal.aborted) {
      return
    }

    this.sleepAbortController?.abort()

    const sleepAbortController = this.sleepAbortController = new AbortController()

    try {
      const signals = [
        playbackAbortSignal,
        sleepAbortController.signal,
      ]

      await sleep(2000, AbortSignal.any(signals))

      this.loadStream()
    } catch {}
  }

  async startPlayback () {
    this.playbackAbortController = new AbortController()

    await this.loadStream()
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.playbackAbortController?.abort()
    this.playbackAbortController = null

    this.pc?.close()
    this.pc = null
    this.cameraVideo.src = ''
    this.cameraVideo.srcObject = null
  }
}
</script>
