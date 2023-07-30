<template>
  <video
    ref="streamingElement"
    :src="cameraVideoSource"
    autoplay
    muted
    :style="cameraStyle"
  />
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'

@Component({})
export default class IpstreamCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  cameraVideoSource = ''

  startPlayback () {
    const url = this.buildAbsoluteUrl(this.camera.urlStream || '').toString()

    this.cameraVideoSource = url

    this.$emit('raw-camera-url', url)
  }

  stopPlayback () {
    this.cameraVideoSource = ''
    this.cameraVideo.src = ''
  }
}
</script>
