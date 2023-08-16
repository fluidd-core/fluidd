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

@Component({})
export default class DeviceCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  startPlayback () {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => (this.cameraVideo.srcObject = stream))
      .then(() => this.$emit('playback'))
  }

  stopPlayback () {
    this.cameraVideo.srcObject = null
  }
}
</script>
