<template>
  <img
    v-show="status === 'connected'"
    ref="streamingElement"
    :src="cameraImageSource"
    :style="cameraStyle"
    :crossorigin="crossorigin"
    @load="updateStatus('connected')"
    @error="updateStatus('error')"
  >
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import consola from 'consola'

@Component({})
export default class MjpegstreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraImage!: HTMLImageElement

  cameraImageSource = ''

  startPlayback () {
    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

      url.searchParams.set('cacheBust', Date.now().toString())

      this.cameraImageSource = url.toString()

      this.updateRawCameraUrl(this.cameraImageSource)
    } catch (e) {
      consola.error(`[MjpegstreamerCamera] failed to start playback "${this.camera.name}"`, e)
    }
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.cameraImageSource = ''
    this.cameraImage.src = ''
  }
}
</script>
