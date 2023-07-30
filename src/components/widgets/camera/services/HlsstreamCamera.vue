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
import CameraMixin from '@/mixins/camera'
import Hls from 'hls.js'

@Component({})
export default class HlsstreamCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  hls: Hls | null = null

  startPlayback () {
    const url = this.buildAbsoluteUrl(this.camera.urlStream || '').toString()

    if (Hls.isSupported()) {
      this.hls?.destroy()

      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxLiveSyncPlaybackRate: 2,
        liveSyncDuration: 0.5,
        liveMaxLatencyDuration: 2,
        backBufferLength: 5
      })
      this.hls.loadSource(url)
      this.hls.attachMedia(this.cameraVideo)
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.cameraVideo.play()
      })
    } else if (this.cameraVideo.canPlayType('application/vnd.apple.mpegurl')) {
      this.cameraVideo.src = url
    }
  }

  stopPlayback () {
    this.hls?.destroy()
    this.hls = null
    this.cameraVideo.src = ''
  }
}
</script>
