<template>
  <video
    ref="streamingElement"
    :src="cameraVideoSource"
    autoplay
    muted
    :crossorigin="crossorigin"
    :style="cameraStyle"
  />
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import consola from 'consola'

@Component({})
export default class IpstreamCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  cameraVideoSource = ''

  startPlayback () {
    try {
      const url = this.buildAbsoluteUrl(this.camera.stream_url || '').toString()

      this.cameraVideoSource = url

      this.$emit('update:raw-camera-url', url)
    } catch (e) {
      consola.error(`[IpstreamCamera] failed to start playback "${this.camera.name}"`, e)
    }
  }

  stopPlayback () {
    this.cameraVideoSource = ''
    this.cameraVideo.src = ''
  }
}
</script>
