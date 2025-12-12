<template>
  <app-dialog
    v-model="open"
    no-actions
    :width="isMobileViewport ? '100%' : '60vw'"
    :title="$t('app.spoolman.title.scan_spool')"
  >
    <v-card-text>
      <v-alert :type="statusMessage.split('.')[0]">
        {{ $t(`app.spoolman.msg.${statusMessage}`) }}
      </v-alert>
      <canvas
        ref="canvas"
        :hidden="true"
      />
      <CameraItem
        :camera="camera"
        :embedded="true"
        crossorigin="anonymous"
        @frame="handlePrinterCameraFrame"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Ref, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import QrScanner from 'qr-scanner'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import type { Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'

const spoomanDataPatterns = [
  /web\+spoolman:s-(\d+)/,
  /\/spool\/show\/(\d+)\/?/
]

@Component({
  components: { CameraItem }
})
export default class QRReader extends Mixins(StateMixin, BrowserMixin) {
  statusMessage = 'info.howto'
  lastScanTimestamp = Date.now()
  processing = false
  context: CanvasRenderingContext2D | null = null

  @VModel({ type: String, default: null })
  source!: null | string

  @Ref('canvas')
  canvas!: HTMLCanvasElement

  get camera (): Moonraker.Webcam.Entry | { name: string, service: 'device' } | undefined {
    if (this.source === 'device') {
      return {
        name: this.$t('app.spoolman.label.device_camera').toString(),
        service: 'device'
      }
    }

    if (this.source !== null) {
      return this.$typedGetters['webcams/getWebcamById'](this.source)
    }
  }

  get open () {
    return this.source !== null
  }

  set open (state) {
    if (!state) {
      this.source = null
    }
  }

  async mounted () {
    this.processing = true
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })
    if (this.context === null) {
      this.statusMessage = 'error.no_image_data'
    }
    this.processing = false
  }

  async handlePrinterCameraFrame (image: HTMLVideoElement | HTMLImageElement) {
    // if broken canvas or still processing
    if (this.processing) {
      return
    }

    // limit to 10 scan attempts per second
    if (Date.now() - this.lastScanTimestamp < 100) {
      return
    }

    this.processing = true
    this.lastScanTimestamp = Date.now()

    if (image instanceof HTMLVideoElement) {
      this.canvas.width = image.videoWidth
      this.canvas.height = image.videoHeight
    } else {
      this.canvas.width = image.naturalWidth
      this.canvas.height = image.naturalHeight
    }

    if (!this.canvas.width || !this.canvas.height) {
      // no image drawn yet
      this.processing = false
      return
    }

    try {
      if (this.context) {
        this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
        const result = await QrScanner.scanImage(this.canvas, { returnDetailedScanResult: true })
        if (result.data) { this.handleCodeFound(result.data) }
      }
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'SecurityError') {
          this.statusMessage = 'error.cors'
        } else {
          this.statusMessage = 'error.no_image_data'
        }
      }

      // no QR code found
    }
    this.processing = false
  }

  get availableSpools (): Spool[] {
    return this.$typedGetters['spoolman/getAvailableSpools']
  }

  handleCodeFound (code: string) {
    for (const pattern of spoomanDataPatterns) {
      const match = pattern.exec(code)

      if (match) {
        // code matches one of known patterns
        const spoolId = match[1]
        if (spoolId && !isNaN(Number(spoolId))) {
          // valid spool ID
          const id = parseInt(spoolId)

          if (this.availableSpools.some(spool => spool.id === id)) {
            // spool exists in spoolman
            this.$emit('detected', id)
          } else {
            // spool doesn't exist
            this.statusMessage = 'error.spool_not_existant'
          }
        } else {
          this.statusMessage = 'warning.invalid_spool_id'
        }

        return
      }
    }

    this.statusMessage = 'warning.code_not_recognized'
  }
}
</script>
