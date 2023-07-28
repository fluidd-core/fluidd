<template>
  <img
    ref="streamingElement"
    :src="cameraImageSource"
    :style="cameraStyle"
    crossorigin="anonymous"
  >
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'

@Component({})
export default class MjpegstreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraImage!: HTMLImageElement

  cameraImageSource = ''

  startPlayback () {
    const url = new URL(this.cameraUrl)

    if (!url.searchParams.get('action')?.startsWith('stream')) {
      url.searchParams.set('action', 'stream')
    }

    url.searchParams.set('cacheBust', Date.now().toString())

    this.cameraImageSource = url.toString()

    this.$emit('raw-camera-url', this.cameraImageSource)
  }

  stopPlayback () {
    this.cameraImageSource = ''
    this.cameraImage.src = ''
  }
}
</script>
