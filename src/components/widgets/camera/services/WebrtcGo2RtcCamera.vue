<template>
  <video
    ref="streamingElement"
    autoplay
    playsinline
    controls
    muted
    :style="cameraStyle"
    :crossorigin="crossorigin"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import consola from 'consola'
import sleep from '@/util/sleep'

@Component({})
export default class WebrtcGo2RtcCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  ws: WebSocket | null = null
  abortController: AbortController | null = null

  // webrtc player methods
  // adapted from https://github.com/AlexxIT/go2rtc/blob/master/www/webrtc.html
  // also adapted from https://github.com/mainsail-crew/mainsail/pull/1651

  get socketUrl () {
    const url = this.buildAbsoluteUrl(this.camera.urlStream || '')
    const socketUrl = new URL('api/ws' + url.search, url)

    socketUrl.searchParams.set('media', 'video+audio')
    socketUrl.protocol = socketUrl.protocol === 'https:'
      ? 'wss:'
      : 'ws:'

    return socketUrl
  }

  startPlayback () {
    this.pc?.close()
    this.ws?.close()

    this.abortController = new AbortController()

    this.pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    })

    const localTracks = ['video', 'audio']
      .map(kind => {
        const init: RTCRtpTransceiverInit = {
          direction: 'recvonly'
        }

        return this.pc?.addTransceiver(kind, init).receiver.track
      })
      .filter((track): track is MediaStreamTrack => track != null)

    this.cameraVideo.srcObject = new MediaStream(localTracks)

    this.ws = new WebSocket(this.socketUrl)
    this.ws.onopen = this.onWebSocketOpen
    this.ws.onmessage = this.onWebSocketMessage
    this.ws.onclose = this.onWebSocketClose
  }

  onWebSocketOpen () {
    consola.debug('[WebrtcGo2RtcCamera] socket opened')

    this.pc?.addEventListener('icecandidate', ev => {
      if (!ev.candidate) return

      const msg = {
        type: 'webrtc/candidate',
        value: ev.candidate.candidate
      }

      this.ws?.send(JSON.stringify(msg))
    })

    this.pc?.createOffer()
      .then(offer => this.pc?.setLocalDescription(offer))
      .then(() => {
        const msg = {
          type: 'webrtc/offer',
          value: this.pc?.localDescription?.sdp
        }

        this.ws?.send(JSON.stringify(msg))
      })
  }

  async onWebSocketClose (ev: CloseEvent) {
    if (!ev.wasClean) {
      consola.error('[WebrtcGo2RtcCamera] socket close was not clean', ev)

      try {
        await sleep(2000, this.abortController?.signal)

        this.startPlayback()
      } catch {}
    }
  }

  onWebSocketMessage (ev: MessageEvent) {
    const msg = JSON.parse(ev.data) as {
      type: 'webrtc/candidate' | 'webrtc/answer' | 'error',
      value: string
    }

    switch (msg.type) {
      case 'webrtc/candidate':
        this.pc?.addIceCandidate({ candidate: msg.value, sdpMid: '0' })
        break

      case 'webrtc/answer':
        this.pc?.setRemoteDescription({ type: 'answer', sdp: msg.value })
        break

      case 'error':
        consola.error(`[WebrtcGo2RtcCamera] ${msg.value}`)
        break
    }
  }

  stopPlayback () {
    this.abortController?.abort()
    this.abortController = null
    this.pc?.close()
    this.pc = null
    this.ws?.close()
    this.ws = null
    this.cameraVideo.src = ''
  }
}
</script>
