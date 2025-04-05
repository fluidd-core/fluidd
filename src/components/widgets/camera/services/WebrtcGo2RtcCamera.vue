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
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'
import sleep from '@/util/sleep'

type RTCConfigurationWithSdpSemantics = RTCConfiguration & {
  sdpSemantics: 'unified-plan'
}

type Go2RtcReceivedMessageType = 'webrtc/candidate' | 'webrtc/offer' | 'webrtc/answer' | 'error'

type Go2RtcMessage = {
  type: Go2RtcReceivedMessageType,
  value?: string
}

@Component({})
export default class WebrtcGo2RtcCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  ws: WebSocket | null = null
  playbackAbortController: AbortController | null = null
  sleepAbortController: AbortController | null = null

  // adapted from https://github.com/AlexxIT/go2rtc/blob/d7cdc8b3b07f6fbff7daae2736377de98444b962/www/video-rtc.js

  loadStream () {
    try {
      this.pc?.close()
      this.ws?.close()

      const abortControllerSignal = this.playbackAbortController?.signal

      if (!abortControllerSignal || abortControllerSignal.aborted) {
        return
      }

      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

      const socketUrl = new URL('api/ws' + url.search, url)

      socketUrl.protocol = socketUrl.protocol === 'https:'
        ? 'wss:'
        : 'ws:'

      this.ws = new WebSocket(socketUrl)
      this.ws.binaryType = 'arraybuffer'
      this.ws.onopen = this.onWebSocketOpen
      this.ws.onmessage = this.onWebSocketMessage
      this.ws.onclose = this.onWebSocketClose

      this.updateRawCameraUrl(url.toString())
    } catch (e) {
      consola.error(`[WebrtcGo2RtcCamera] failed to start playback "${this.camera.name}"`, e)
    }
  }

  async onWebSocketOpen () {
    consola.debug('[WebrtcGo2RtcCamera] socket opened')

    const config: RTCConfigurationWithSdpSemantics = {
      bundlePolicy: 'max-bundle',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan'
    }

    this.pc = new RTCPeerConnection(config)

    this.pc.onicecandidate = ev => {
      if (!ev.candidate) return

      const msg: Go2RtcMessage = {
        type: 'webrtc/candidate',
        value: ev.candidate.toJSON().candidate
      }

      this.ws?.send(JSON.stringify(msg))
    }

    this.pc.onconnectionstatechange = () => {
      switch (this.pc?.connectionState) {
        case 'connected': {
          const tracks = this.pc.getTransceivers()
            .filter(tr => tr.direction === 'recvonly')
            .map(tr => tr.receiver.track)

          this.cameraVideo.srcObject = new MediaStream(tracks)

          break
        }
        case 'failed':
        case 'disconnected':
          this.loadStream()
      }
    }

    this.pc.addTransceiver('video', { direction: 'recvonly' })

    const offer = await this.pc.createOffer()

    await this.pc.setLocalDescription(offer)

    const msg: Go2RtcMessage = {
      type: 'webrtc/offer',
      value: offer.sdp
    }

    this.ws?.send(JSON.stringify(msg))
  }

  async onWebSocketMessage (ev: MessageEvent) {
    const msg = JSON.parse(ev.data) as Go2RtcMessage

    switch (msg.type) {
      case 'webrtc/candidate':
        try {
          await this.pc?.addIceCandidate({ candidate: msg.value, sdpMid: '0' })
        } catch (error) {
          consola.warn('[WebrtcGo2RtcCamera] RTCPeerConnection.addIceCandidate() error', error)
        }
        break

      case 'webrtc/answer':
        try {
          this.pc?.setRemoteDescription({ type: 'answer', sdp: msg.value })
        } catch (error) {
          consola.warn('[WebrtcGo2RtcCamera] RTCPeerConnection.setRemoteDescription() error', error)
        }
        break

      case 'error':
        consola.error(`[WebrtcGo2RtcCamera] ${msg.value}`)
        this.updateStatus('error')
        this.pc?.close()
    }
  }

  async onWebSocketClose (ev: CloseEvent) {
    if (!ev.wasClean) {
      this.updateStatus('error')

      consola.error('[WebrtcGo2RtcCamera] socket close was not clean', ev)

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
  }

  startPlayback () {
    this.playbackAbortController = new AbortController()

    this.loadStream()
  }

  stopPlayback () {
    this.playbackAbortController?.abort()
    this.playbackAbortController = null
    this.updateStatus('disconnected')
    if (this.pc) {
      this.pc.getSenders().forEach(sender => {
        sender.track?.stop()
      })
      this.pc.close()
      this.pc = null
    }
    this.ws?.close()
    this.ws = null
    this.cameraVideo.src = ''
    this.cameraVideo.srcObject = null
  }
}
</script>
