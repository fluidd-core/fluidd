<template>
  <img
    v-show="status === 'connected'"
    ref="streamingElement"
    :src="cameraImageSource"
    :style="cameraStyle"
    :crossorigin="crossorigin"
    @load="handleImageLoad"
    @error="updateStatus('error')"
  >
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'

@Component({})
export default class MjpegstreamerAdaptiveCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraImage!: HTMLImageElement

  cameraImageSource = ''
  cameraImageSourceUrl: URL | null = null
  requestStartTime = performance.now()
  startTime = performance.now()
  time = 0
  requestTime = 0
  timeSmoothing = 0.6
  requestTimeSmoothing = 0.1

  get autoRaiseFrameEvent () {
    return false
  }

  handleImageLoad () {
    this.updateStatus('connected')
    this.$emit('frame', this.streamingElement)

    const fpsTarget = (!document.hasFocus() && this.camera.target_fps_idle) || this.camera.target_fps || 10
    const endTime = performance.now()
    const currentTime = endTime - this.startTime

    this.time = (this.time * this.timeSmoothing) + (currentTime * (1.0 - this.timeSmoothing))

    this.startTime = endTime

    const targetTime = 1000 / fpsTarget

    const currentRequestTime = performance.now() - this.requestStartTime

    this.requestTime = (this.requestTime * this.requestTimeSmoothing) + (currentRequestTime * (1.0 - this.requestTimeSmoothing))

    const timeout = Math.max(0, targetTime - this.requestTime)

    this.$nextTick(() => {
      setTimeout(this.handleRefresh, timeout)
    })
  }

  handleRefresh () {
    if (!document.hidden) {
      if (this.time !== 0) {
        const framesPerSecond = Math.round(1000 / this.time).toString().padStart(2, '0')

        this.updateFramesPerSecond(framesPerSecond)
      }
      this.$nextTick(() => this.updateCameraImageSource())
    } else {
      this.stopPlayback()
    }
  }

  updateCameraImageSource () {
    const url = this.cameraImageSourceUrl

    if (url) {
      url.searchParams.set('cacheBust', Date.now().toString())

      this.requestStartTime = performance.now()

      this.cameraImageSource = url.toString()
    }
  }

  startPlayback () {
    try {
      this.updateStatus('connecting')

      this.cameraImageSourceUrl = this.buildAbsoluteUrl(this.camera.snapshot_url || '')

      this.updateCameraImageSource()

      const rawUrl = this.buildAbsoluteUrl(this.camera.stream_url || '')

      rawUrl.searchParams.set('cacheBust', Date.now().toString())

      this.updateRawCameraUrl(rawUrl.toString())
    } catch (e) {
      consola.error(`[MjpegstreamerAdaptiveCamera] failed to start playback "${this.camera.name}"`, e)
    }
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.cameraImageSourceUrl = null
    this.cameraImageSource = ''
    this.cameraImage.src = ''
  }
}
</script>
