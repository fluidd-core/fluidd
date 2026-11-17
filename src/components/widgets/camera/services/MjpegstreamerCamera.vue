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

const workerConnectionTimeout = 10000

@Component({})
export default class MjpegstreamerCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraImage!: HTMLImageElement

  startTime = 0
  time = 0
  timeSmoothing = 0.6

  worker: Worker | null = null
  imageObjectUrl: string | null = null
  workerConnectionTimeoutId: number | null = null
  nativePlayback = false
  streamUrl = ''

  handleImageLoad () {
    if (!this.streamUrl) {
      return
    }

    this.updateStatus('connected')

    this.revokeImageObjectURL()
  }

  handleImageError () {
    if (!this.streamUrl) {
      return
    }

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

  clearWorkerConnectionTimeout () {
    if (this.workerConnectionTimeoutId !== null) {
      clearTimeout(this.workerConnectionTimeoutId)
      this.workerConnectionTimeoutId = null
    }
  }

  stopWorker () {
    this.clearWorkerConnectionTimeout()

    const worker = this.worker
    this.worker = null

    if (worker) {
      worker.onmessage = null
      worker.onerror = null
      worker.onmessageerror = null
      worker.terminate()
    }
  }

  startNativePlayback () {
    if (!this.streamUrl) {
      return
    }

    this.stopWorker()
    this.revokeImageObjectURL()
    this.nativePlayback = true
    this.updateFramesPerSecond(-1)
    this.updateRawCameraUrl(this.streamUrl)
    this.updateStatus('connecting')
    this.cameraImage.src = this.streamUrl
  }

  fallbackToNativePlayback (error?: unknown) {
    consola.warn(`[MjpegstreamerCamera] using native playback for "${this.camera.name}"`, error)

    this.startNativePlayback()
  }

  startPlayback () {
    this.stopPlayback()

    try {
      this.updateStatus('connecting')

      const url = this.buildAbsoluteUrl(this.camera.stream_url || '')

      url.searchParams.set('cacheBust', Date.now().toString())

      this.streamUrl = url.toString()

      if (this.nativePlayback) {
        this.startNativePlayback()
        return
      }

      const worker = this.worker = markRaw(new MjpegWorker())

      worker.onmessage = (event: MessageEvent<MjpegWorkerResponseMessage>) => {
        if (this.worker !== worker) {
          return
        }

        const message = event.data

        switch (message.action) {
          case 'frame': {
            this.clearWorkerConnectionTimeout()

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
            if (this.workerConnectionTimeoutId !== null) {
              this.fallbackToNativePlayback(new Error('MJPEG stream ended without a frame'))
            } else {
              this.stopPlayback()
            }

            break

          case 'error':
            this.fallbackToNativePlayback(message.error)

            break
        }
      }

      worker.onerror = (event) => {
        if (this.worker === worker) {
          event.preventDefault()
          this.fallbackToNativePlayback(event.message)
        }
      }

      worker.onmessageerror = () => {
        if (this.worker === worker) {
          this.fallbackToNativePlayback(new Error('Unable to receive MJPEG frames'))
        }
      }

      this.workerConnectionTimeoutId = window.setTimeout(() => {
        if (this.worker === worker) {
          this.fallbackToNativePlayback(new Error('No MJPEG frames received'))
        }
      }, workerConnectionTimeout)

      const message: MjpegWorkerRequestMessage = {
        action: 'start',
        url: url.toString()
      }

      this.time = 0
      this.startTime = performance.now()

      worker.postMessage(message)
    } catch (e) {
      if (this.streamUrl) {
        this.fallbackToNativePlayback(e)
      } else {
        consola.error(`[MjpegstreamerCamera] failed to start playback "${this.camera.name}"`, e)

        this.updateStatus('error')
      }
    }
  }

  stopPlayback () {
    this.stopWorker()
    this.revokeImageObjectURL()
    this.streamUrl = ''
    this.updateStatus('disconnected')
    this.cameraImage.removeAttribute('src')
  }
}
</script>
