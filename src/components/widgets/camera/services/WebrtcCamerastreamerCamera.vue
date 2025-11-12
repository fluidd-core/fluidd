<template>
  <video
    ref="streamingElement"
    autoplay
    disablePictureInPicture
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

const iceServers = [
  {
    urls: [
      'stun:stun.l.google.com:19302'
    ]
  }
]

@Component({})
export default class WebrtcCamerastreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  remoteId: string | null = null
  playbackAbortController: AbortController | null = null
  sleepAbortController: AbortController | null = null
  sendIceServers = true

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
      const rtcSessionDescriptionInit = await this.sendInitialRequest(url, abortControllerSignal)

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
              await this.sendRemoteCandidatesRequest(url, [event.candidate], abortControllerSignal)
            } catch (e) {
              consola.error('[WebrtcCamerastreamerCamera] onicecandidate', e)
            }
          }
        }
      }

      await pc.setRemoteDescription(rtcSessionDescriptionInit)

      const rtcLocalSessionDescriptionInit = await pc.createAnswer()

      await pc.setLocalDescription(rtcLocalSessionDescriptionInit)

      if (pc.localDescription) {
        await this.sendOfferRequest(url, pc.localDescription, abortControllerSignal)
      }
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

  async sendInitialRequest (url: string | URL | Request, abortControllerSignal: AbortSignal): Promise<RTCSessionDescriptionInit> {
    try {
      const response = await fetch(url, {
        body: JSON.stringify({
          type: 'request',
          ...this.sendIceServers
            ? { iceServers }
            : undefined,
          keepAlive: true
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        signal: abortControllerSignal
      })

      await this.ensureResponseOk(response, 'application/json')

      const data = await response.json() as RTCSessionDescriptionInit

      return data
    } catch (e) {
      const aborted = (
        abortControllerSignal.aborted ||
        (
          e instanceof Error &&
          e.name === 'AbortError'
        )
      )

      if (!aborted) {
        // Switch whether to send iceServers next time
        this.sendIceServers = !this.sendIceServers
      }

      throw e
    }
  }

  async sendRemoteCandidatesRequest (url: string | URL | Request, candidates: RTCIceCandidateInit[], abortControllerSignal: AbortSignal): Promise<void> {
    const response = await fetch(url, {
      body: JSON.stringify({
        type: 'remote_candidate',
        id: this.remoteId,
        candidates
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      signal: abortControllerSignal
    })

    await this.ensureResponseOk(response)
  }

  async sendOfferRequest (url: string | URL | Request, offer: RTCSessionDescriptionInit, abortControllerSignal: AbortSignal): Promise<void> {
    const response = await fetch(url, {
      body: JSON.stringify({
        type: offer.type,
        id: this.remoteId,
        sdp: offer.sdp
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      signal: abortControllerSignal
    })

    await this.ensureResponseOk(response)
  }

  async ensureResponseOk (response: Response, expectedContentType?: string): Promise<void> {
    const contentType = response.headers.get('Content-Type')

    const responseOk = (
      response.ok &&
      (
        !expectedContentType ||
        contentType?.includes(expectedContentType)
      )
    )

    if (!responseOk) {
      const body = await response.text()

      throw new Error(`Invalid response! Status: ${response.status}, Content-Type: ${contentType}, Body: ${body}`)
    }
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
