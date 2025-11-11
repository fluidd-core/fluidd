<template>
  <img
    v-show="status === 'connected'"
    ref="streamingElement"
    :style="cameraStyle"
    :crossorigin="crossorigin"
    @load="handleImageLoad"
    @error="handleImageError"
  >
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'

import type { MjpegWorkerClientMessage, MjpegWorkerServerMessage } from '@/workers/mjpegStream.worker'

import MjpegWorker from '@/workers/mjpegStream.worker?ts?worker'

@Component({})
export default class MjpegstreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraImage!: HTMLImageElement

  startTime = 0
  time = 0
  timeSmoothing = 0.6

  worker: Worker | null = null
  imageObjectUrl: string | null = null

  handleImageLoad () {
    this.updateStatus('connected')

    this.revokeImageObjectURL()
  }

  handleImageError () {
    this.updateStatus('error')

    this.revokeImageObjectURL()
  }

  revokeImageObjectURL () {
    const imageObjectUrl = this.imageObjectUrl

    if (imageObjectUrl != null) {
      URL.revokeObjectURL(imageObjectUrl)

      this.imageObjectUrl = null
    }
  }

  startPlayback () {
    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

      url.searchParams.set('cacheBust', Date.now().toString())

      const worker = this.worker = new MjpegWorker()

      worker.addEventListener('message', (event: MessageEvent<MjpegWorkerClientMessage>) => {
        switch (event.data.action) {
          case 'frame': {
            const endTime = performance.now()
            const currentTime = endTime - this.startTime

            this.time = (this.time * this.timeSmoothing) + (currentTime * (1.0 - this.timeSmoothing))

            this.startTime = endTime

            if (this.time !== 0) {
              this.updateFramesPerSecond(Math.round(1000 / this.time))
            }

            this.revokeImageObjectURL()

            const blob = new Blob([event.data.data.buffer], { type: 'image/jpeg' })

            this.cameraImage.src = this.imageObjectUrl = URL.createObjectURL(blob)

            break
          }

          case 'done':
            this.stopPlayback()

            break

          case 'error':
            this.updateStatus('error')

            this.stopPlayback()

            break
        }
      })

      const message: MjpegWorkerServerMessage = {
        action: 'start',
        url: url.toString()
      }

      this.time = 0
      this.startTime = performance.now()

      worker.postMessage(message)
    } catch (e) {
      consola.error(`[MjpegstreamerCamera] failed to start playback "${this.camera.name}"`, e)

      this.updateStatus('error')
    }
  }

  stopPlayback () {
    this.worker?.terminate()
    this.worker = null
    this.revokeImageObjectURL()
    this.updateStatus('disconnected')
    this.cameraImage.src = ''
  }
}
</script>
