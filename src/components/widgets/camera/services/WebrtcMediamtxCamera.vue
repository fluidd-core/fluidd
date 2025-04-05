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

type RTCConfigurationWithSdpSemantics = RTCConfiguration & {
  sdpSemantics: 'unified-plan'
}

type RTCIceServerWithCredentialType = RTCIceServer & {
  credentialType?: 'password'
}

type MediamtxOffer = {
  iceUfrag: string,
  icePwd: string,
  medias: string[]
}

@Component({})
export default class WebrtcMediamtxCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  // webrtc player methods
  // adapted from https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/read_index.html

  whepUrl: string = ''
  sessionUrl: string = ''
  pc: RTCPeerConnection | null = null
  restartTimeout: number | null = null
  offerData: MediamtxOffer | null = null
  queuedCandidates: RTCIceCandidate[] = []

  unquoteCredential (v: string): string {
    return JSON.parse(`"${v}"`) as string
  }

  linkToIceServers (links: string | null): RTCIceServerWithCredentialType[] {
    return (links !== null)
      ? links.split(', ').map((link) => {
        const m = link.match(/^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i)
        const ret: RTCIceServerWithCredentialType = {
          urls: [m![1]]
        }

        if (m![3] !== undefined) {
          ret.username = this.unquoteCredential(m![3])
          ret.credential = this.unquoteCredential(m![4])
          ret.credentialType = 'password'
        }

        return ret
      })
      : []
  }

  parseOffer (offer: string): MediamtxOffer {
    const ret: MediamtxOffer = {
      iceUfrag: '',
      icePwd: '',
      medias: []
    }

    for (const line of offer.split('\r\n')) {
      if (line.startsWith('m=')) {
        ret.medias.push(line.slice('m='.length))
      } else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
        ret.iceUfrag = line.slice('a=ice-ufrag:'.length)
      } else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
        ret.icePwd = line.slice('a=ice-pwd:'.length)
      }
    }

    return ret
  }

  generateSdpFragment (od: MediamtxOffer, candidates: RTCIceCandidate[]) {
    const candidatesByMedia: Record<number, RTCIceCandidate[]> = {}

    for (const candidate of candidates) {
      const mid = candidate.sdpMLineIndex!
      if (candidatesByMedia[mid] === undefined) {
        candidatesByMedia[mid] = []
      }
      candidatesByMedia[mid].push(candidate)
    }

    let frag = 'a=ice-ufrag:' + od.iceUfrag + '\r\n' + 'a=ice-pwd:' + od.icePwd + '\r\n'

    let mid = 0

    for (const media of od.medias) {
      if (candidatesByMedia[mid] !== undefined) {
        frag += 'm=' + media + '\r\n' + 'a=mid:' + mid + '\r\n'

        for (const candidate of candidatesByMedia[mid]) {
          frag += 'a=' + candidate.candidate + '\r\n'
        }
      }
      mid++
    }

    return frag
  }

  async loadStream () {
    try {
      this.updateStatus('connecting')

      const res = await fetch(this.whepUrl, {
        method: 'OPTIONS'
      })

      const config: RTCConfigurationWithSdpSemantics = {
        iceServers: this.linkToIceServers(res.headers.get('Link')),
        // https://webrtc.org/getting-started/unified-plan-transition-guide
        sdpSemantics: 'unified-plan'
      }

      this.pc = new RTCPeerConnection(config)

      this.pc.addTransceiver('video', { direction: 'recvonly' })

      this.pc.onicecandidate = evt => {
        if (this.restartTimeout !== null) {
          return
        }

        if (evt.candidate !== null) {
          if (this.sessionUrl === '') {
            this.queuedCandidates.push(evt.candidate)
          } else {
            this.sendLocalCandidates([evt.candidate])
          }
        }
      }

      this.pc.oniceconnectionstatechange = () => {
        if (this.restartTimeout !== null) {
          return
        }

        if (this.pc?.iceConnectionState === 'disconnected') {
          consola.warn('[WebrtcMediamtxCamera] peer connection disconnected')

          this.onError()
        }
      }

      this.pc.ontrack = (evt) => {
        this.cameraVideo.srcObject = evt.streams[0]
      }

      const offer = await this.pc.createOffer()

      this.offerData = this.parseOffer(offer.sdp ?? '')

      this.pc.setLocalDescription(offer)

      this.sendOffer(offer)
    } catch (err: unknown) {
      consola.error(`[WebrtcMediamtxCamera] error on loadStream "${this.camera.name}"`, err)

      this.onError()
    }
  }

  onError () {
    this.updateStatus('error')

    if (this.restartTimeout !== null) {
      return
    }

    if (this.pc !== null) {
      this.pc.close()
      this.pc = null
    }

    this.restartTimeout = window.setTimeout(() => {
      this.restartTimeout = null
      this.loadStream()
    }, 2000)

    if (this.sessionUrl) {
      fetch(this.sessionUrl, {
        method: 'DELETE'
      })

      this.sessionUrl = ''
    }

    this.queuedCandidates = []
  }

  async sendLocalCandidates (candidates: RTCIceCandidate[]) {
    try {
      const res = await fetch(this.sessionUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/trickle-ice-sdpfrag',
          'If-Match': '*'
        },
        body: this.generateSdpFragment(this.offerData!, candidates)
      })

      switch (res.status) {
        case 204:
          break

        case 404:
          throw new Error('stream not found')

        default:
          throw new Error(`bad status code ${res.status}`)
      }
    } catch (err: unknown) {
      consola.error('[WebrtcMediamtxCamera] error on sendLocalCandidates', err)

      this.onError()
    }
  }

  onRemoteAnswer (sdp: string) {
    if (this.restartTimeout !== null) {
      return
    }

    this.pc?.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp
    }))

    if (this.queuedCandidates.length !== 0) {
      this.sendLocalCandidates(this.queuedCandidates)
      this.queuedCandidates = []
    }
  }

  async sendOffer (offer: RTCSessionDescriptionInit) {
    try {
      const res = await fetch(this.whepUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      })

      switch (res.status) {
        case 201:
          break

        case 404:
          throw new Error('stream not found')

        default:
          throw new Error(`bad status code ${res.status}`)
      }

      this.sessionUrl = new URL(res.headers.get('location') ?? '', this.baseUrl).toString()

      const sdp = await res.text()

      this.onRemoteAnswer(sdp)
    } catch (err: unknown) {
      consola.error('[WebrtcMediamtxCamera] error on sendOffer', err)

      this.onError()
    }
  }

  get baseUrl () {
    const baseUrl = this.buildAbsoluteUrl(this.camera.stream_url || '')

    if (!baseUrl.pathname.endsWith('/')) {
      baseUrl.pathname += '/'
    }

    return baseUrl
  }

  startPlayback () {
    this.whepUrl = new URL('whep', this.baseUrl).toString()

    this.loadStream()
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.sessionUrl = ''
    this.queuedCandidates = []

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
    this.cameraVideo.src = ''
    this.cameraVideo.srcObject = null
  }
}
</script>
