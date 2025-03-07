<template>
  <iframe
    ref="streamingElement"
    :src="cameraIFrameSource"
    style="border: none; width: 100%"
    :style="{
      'aspect-ratio': (camera.aspect_ratio || '16:9').replace(':', '/'),
      ...cameraStyle
    }"
    @load="updateStatus('connected')"
    @error="updateStatus('error')"
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
    this.updateStatus('connecting')

    const url = this.buildAbsoluteUrl(this.camera.stream_url || '').toString()

    this.cameraIFrameSource = url

    this.updateRawCameraUrl(url)
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.cameraIFrameSource = ''
    this.cameraIframe.src = ''
  }
}
</script>
