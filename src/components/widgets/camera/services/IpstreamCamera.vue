<template>
  <video
    ref="streamingElement"
    :src="cameraVideoSource"
    autoplay
    muted
    :crossorigin="crossorigin"
    :style="cameraStyle"
    @play="updateStatus('connected')"
    @error="updateStatus('error')"
  />
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'

@Component({})
export default class IpstreamCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  cameraVideoSource = ''

  get autoRaiseFrameEvent () {
    return false
  }

  startPlayback () {
    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '').toString()

      this.cameraVideoSource = url

      this.updateRawCameraUrl(url)
    } catch (e) {
      consola.error(`[IpstreamCamera] failed to start playback "${this.camera.name}"`, e)
    }
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.cameraVideoSource = ''
    this.cameraVideo.src = ''
  }
}
</script>
