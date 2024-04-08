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
import CameraMixin from '@/mixins/camera'
import consola from 'consola'

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

  retryPause = 2000

  url: string = ''
  sessionUrl: string = ''
  pc: RTCPeerConnection | null = null
  restartTimeout: number | null = null
  offerData: MediamtxOffer | null = null
  queuedCandidates: RTCIceCandidate[] = []
  defaultControls = false

  setMessage (str: string) {
    if (str) {
      this.cameraVideo.controls = false
    } else {
      this.cameraVideo.controls = this.defaultControls
    }
    consola.debug('[WebrtcMediamtxCamera] ' + str)
  }

  unquoteCredential (v: string): string {
    return JSON.parse(`"${v}"`)
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
      medias: [] as string[]
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

  enableStereoOpus (section: string): string {
    let opusPayloadFormat = ''
    const lines = section.split('\r\n')

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('a=rtpmap:') && lines[i].toLowerCase().includes('opus/')) {
        opusPayloadFormat = lines[i].slice('a=rtpmap:'.length).split(' ')[0]
        break
      }
    }

    if (opusPayloadFormat === '') {
      return section
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('a=fmtp:' + opusPayloadFormat + ' ')) {
        if (!lines[i].includes('stereo')) {
          lines[i] += ';stereo=1'
        }
        if (!lines[i].includes('sprop-stereo')) {
          lines[i] += ';sprop-stereo=1'
        }
      }
    }

    return lines.join('\r\n')
  }

  editOffer (offer: RTCSessionDescriptionInit) {
    const sections = offer.sdp?.split('m=') ?? []

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      if (section.startsWith('audio')) {
        sections[i] = this.enableStereoOpus(section)
      }
    }

    offer.sdp = sections.join('m=')
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

  loadStream () {
    this.requestICEServers()
  }

  onError (err: unknown) {
    if (this.restartTimeout === null) {
      this.setMessage(err + ', retrying in some seconds')

      if (this.pc !== null) {
        this.pc.close()
        this.pc = null
      }

      this.restartTimeout = window.setTimeout(() => {
        this.restartTimeout = null
        this.loadStream()
      }, this.retryPause)

      if (this.sessionUrl) {
        fetch(this.sessionUrl, {
          method: 'DELETE'
        })
      }

      this.queuedCandidates = []
    }
  }

  async sendLocalCandidates (candidates: RTCIceCandidate[]) {
    consola.debug('[WebrtcMediamtxCamera] sendLocalCandidates')

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
      this.onError(err)
    }
  }

  onLocalCandidate (evt: RTCPeerConnectionIceEvent) {
    consola.debug('[WebrtcMediamtxCamera] onLocalCandidate')

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
    consola.debug('[WebrtcMediamtxCamera] sendOffer')

    try {
      const res = await fetch(this.url, {
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
      this.onError(err)
    }
  }

  async createOffer () {
    const offer = await this.pc?.createOffer()

    if (offer) {
      this.editOffer(offer)
      this.offerData = this.parseOffer(offer.sdp ?? '')
      this.pc?.setLocalDescription(offer)

      this.sendOffer(offer)
    }
  }

  onConnectionState () {
    if (this.restartTimeout !== null) {
      return
    }

    if (this.pc?.iceConnectionState === 'disconnected') {
      this.onError('peer connection disconnected')
    }
  }

  onTrack (evt: RTCTrackEvent) {
    this.setMessage('')
    this.cameraVideo.srcObject = evt.streams[0]
  }

  async requestICEServers () {
    consola.debug('[WebrtcMediamtxCamera] requestICEServers')

    try {
      const res = await fetch(this.url, {
        method: 'OPTIONS'
      })

      const config: RTCConfigurationWithSdpSemantics = {
        iceServers: this.linkToIceServers(res.headers.get('Link')),
        // https://webrtc.org/getting-started/unified-plan-transition-guide
        sdpSemantics: 'unified-plan'
      }
      this.pc = new RTCPeerConnection(config)

      const direction = 'sendrecv'
      this.pc.addTransceiver('video', { direction })
      this.pc.addTransceiver('audio', { direction })

      this.pc.onicecandidate = (evt) => this.onLocalCandidate(evt)
      this.pc.oniceconnectionstatechange = () => this.onConnectionState()
      this.pc.ontrack = (evt) => this.onTrack(evt)

      this.createOffer()
    } catch (err: unknown) {
      this.onError(err)
    }
  }

  parseBoolString (str: string | null | undefined, defaultVal: boolean) {
    str = (str || '')

    if (['1', 'yes', 'true'].includes(str.toLowerCase())) {
      return true
    }
    if (['0', 'no', 'false'].includes(str.toLowerCase())) {
      return false
    }
    return defaultVal
  }

  loadAttributesFromQuery () {
    const params = new URLSearchParams(window.location.search)
    this.cameraVideo.controls = this.parseBoolString(params.get('controls'), true)
    this.cameraVideo.muted = this.parseBoolString(params.get('muted'), true)
    this.cameraVideo.autoplay = this.parseBoolString(params.get('autoplay'), true)
    this.cameraVideo.playsInline = this.parseBoolString(params.get('playsinline'), true)
    this.defaultControls = this.cameraVideo.controls
  }

  get baseUrl () {
    const baseUrl = this.buildAbsoluteUrl(this.camera.stream_url || '')

    if (!baseUrl.pathname.endsWith('/')) {
      baseUrl.pathname += '/'
    }

    return baseUrl
  }

  startPlayback () {
    this.url = new URL('whep', this.baseUrl).toString()

    this.loadStream()
  }

  stopPlayback () {
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
