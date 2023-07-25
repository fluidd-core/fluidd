<template>
  <iframe
    ref="streamingElement"
    :src="cameraIFrameSource"
    style="border: none; width: 100%"
    :style="{
      'aspect-ratio': (camera.aspectRatio || '16:9').replace(':', '/'),
      ...cameraStyle
    }"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'

@Component({})
export default class IframeCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraIframe!: HTMLIFrameElement

  cameraIFrameSource = ''

  startPlayback () {
    this.cameraIFrameSource = this.cameraUrl

    this.$emit('raw-camera-url', this.cameraUrl)
  }

  stopPlayback () {
    this.cameraIFrameSource = ''
    this.cameraIframe.src = ''
  }
}
</script>
