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
import { markRaw } from 'vue'
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'

import type { MjpegWorkerResponseMessage, MjpegWorkerRequestMessage } from '@/workers/mjpegStream.worker'

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
    let streamUrl: string | undefined

    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

      url.searchParams.set('cacheBust', Date.now().toString())

      const currentStreamUrl = streamUrl = url.toString()

      this.updateRawCameraUrl(currentStreamUrl)

      const worker = this.worker = markRaw(new MjpegWorker())

      let hasReceivedFrame = false

      const handleWorkerFailure = () => {
        if (hasReceivedFrame) {
          this.updateStatus('error')

          this.stopPlayback()
        } else {
          this.startNativePlayback(currentStreamUrl)
        }
      }

      worker.onerror = (event: ErrorEvent) => {
        if (worker !== this.worker) {
          return
        }

        consola.error(`[MjpegstreamerCamera] worker failed "${this.camera.name}"`, event.message)

        handleWorkerFailure()
      }

      worker.onmessage = (event: MessageEvent<MjpegWorkerResponseMessage>) => {
        if (worker !== this.worker) {
          return
        }

        const message = event.data

        switch (message.action) {
          case 'frame': {
            hasReceivedFrame = true

            const endTime = performance.now()
            const currentTime = endTime - this.startTime

            this.time = (this.time * this.timeSmoothing) + (currentTime * (1.0 - this.timeSmoothing))

            this.startTime = endTime

            if (this.time !== 0) {
              this.updateFramesPerSecond(Math.round(1000 / this.time))
            }

            this.revokeImageObjectURL()

            const blob = new Blob([message.data.buffer], { type: 'image/jpeg' })

            this.cameraImage.src = this.imageObjectUrl = URL.createObjectURL(blob)

            break
          }

          case 'done':
            this.stopPlayback()

            break

          case 'error':
            handleWorkerFailure()

            break
        }
      }

      const message: MjpegWorkerRequestMessage = {
        action: 'start',
        url: currentStreamUrl
      }

      this.time = 0
      this.startTime = performance.now()

      worker.postMessage(message)
    } catch (e) {
      consola.error(`[MjpegstreamerCamera] failed to start playback "${this.camera.name}"`, e)

      if (streamUrl != null) {
        this.startNativePlayback(streamUrl)
      } else {
        this.updateStatus('error')
      }
    }
  }

  // WebKit cancels multipart/x-mixed-replace loads unless they come from an image,
  // so fetching the stream fails there, while the image element can still play it
  startNativePlayback (url: string) {
    consola.debug(`[MjpegstreamerCamera] using native playback for "${this.camera.name}"`)

    this.worker?.terminate()
    this.worker = null
    this.updateStatus('connecting')
    this.updateFramesPerSecond(-1)
    this.cameraImage.src = url
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
