<template>
  <video
    ref="streamingElement"
    autoplay
    muted
    :crossorigin="crossorigin"
    :style="cameraStyle"
    @play="updateStatus('connected')"
    @error="updateStatus('error')"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import Hls from 'hls.js'
import { consola } from 'consola'

@Component({})
export default class HlsstreamCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  hls: Hls | null = null

  startPlayback () {
    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '').toString()

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
        this.hls.on(Hls.Events.ERROR, () => {
          this.updateStatus('error')
        })
      } else if (this.cameraVideo.canPlayType('application/vnd.apple.mpegurl')) {
        this.cameraVideo.src = url
      }
    } catch (e) {
      consola.error(`[HlsstreamCamera] failed to start playback "${this.camera.name}"`, e)

      this.updateStatus('error')
    }
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.hls?.destroy()
    this.hls = null
    this.cameraVideo.src = ''
  }
}
</script>
