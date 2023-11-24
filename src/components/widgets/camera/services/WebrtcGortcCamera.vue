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

@Component({})
export default class WebrtcGortcCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  remoteId: string | null = null
  ws: WebSocket | null = null

  // webrtc player methods
  // adapted from https://github.com/AlexxIT/go2rtc/blob/master/www/webrtc.html
  // also adapted from https://github.com/mainsail-crew/mainsail/pull/1651

  get url () {
    const urlSearch = new URL(this.buildAbsoluteUrl(this.camera.urlStream || '')).search.toString()
    const url = new URL('api/ws' + urlSearch, this.buildAbsoluteUrl(this.camera.urlStream || ''))
    url.searchParams.set('media', 'video+audio')
    // change protocol to ws
    if (url.protocol === 'https') { url.protocol = 'wss' + ':' } else { url.protocol = 'ws' + ':' }
    return url.toString()
  }

  startPlayback () {
    this.pc?.close()
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    const localTracks: MediaStreamTrack[] = []
    const kinds = ['video', 'audio']
    kinds.forEach((kind: string) => {
      const track = this.pc?.addTransceiver(kind, { direction: 'recvonly' }).receiver.track
      if (track) localTracks.push(track)
    })
    this.cameraVideo.srcObject = new MediaStream(localTracks)

    this.ws = new WebSocket(this.url)
    this.ws.addEventListener('open', () => this.onWebSocketOpen())
    this.ws.addEventListener('message', (ev) => this.onWebSocketMessage(ev))
  }

  onWebSocketOpen () {
    this.pc?.addEventListener('icecandidate', (ev) => {
      if (!ev.candidate) return
      const msg = { type: 'webrtc/candidate', value: ev.candidate.candidate }
      this.ws?.send(JSON.stringify(msg))
    })
    this.pc
      ?.createOffer()
      .then((offer) => this.pc?.setLocalDescription(offer))
      .then(() => {
        const msg = { type: 'webrtc/offer', value: this.pc?.localDescription?.sdp }
        this.ws?.send(JSON.stringify(msg))
      })
  }

  onWebSocketMessage (ev: MessageEvent) {
    const msg = JSON.parse(ev.data)
    if (msg.type === 'webrtc/candidate') {
      this.pc?.addIceCandidate({ candidate: msg.value, sdpMid: '0' })
    } else if (msg.type === 'webrtc/answer') {
      this.pc?.setRemoteDescription({ type: 'answer', sdp: msg.value })
    }
  }

  terminate () {
    if (this.pc !== null) {
      this.pc.close()
      this.pc = null
    }
    if (this.ws !== null) {
      this.ws.close()
      this.ws = null
    }
  }

  stopPlayback () {
    this.terminate()
    this.pc = null
    this.cameraVideo.src = ''
  }
}
</script>
