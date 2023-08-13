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
import { Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'

@Component({
  components: { CameraItem }
})
export default class QRReader extends Mixins(StateMixin, BrowserMixin) {
  dataPatterns = [
    /web\+spoomnan:s-(\d+)/,
    /\/spool\/show\/(\d+)\/?/
  ]

  statusMessage = 'info.howto'
  lastScanTimestamp = Date.now()
  processing = false

  video!: HTMLVideoElement | HTMLImageElement
  context!: CanvasRenderingContext2D

  @VModel({ type: String, default: null })
    source!: null | string

  @Ref('canvas')
    canvas!: HTMLCanvasElement

  get camera () {
    return this.$store.getters['cameras/getCameraById'](this.source)
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
    this.context = this.canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
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

    try {
      this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
      const result = await QrScanner.scanImage(this.canvas, { returnDetailedScanResult: true })
      if (result.data) { this.handleCodeFound(result.data) }
    } catch (err) {
      if (err instanceof DOMException) {
        this.statusMessage = 'error.no_image_data'
      }

      // no QR code found
    }
    this.processing = false
  }

  get availableSpools () {
    return this.$store.getters['spoolman/getAvailableSpools']
  }

  handleCodeFound (code: string) {
    // valid QR code found
    const pattern = this.dataPatterns.find(pattern => pattern.test(code))
    if (pattern) {
      // code matches one of known patterns
      const spoolId = code.match(pattern)?.[1]
      if (spoolId && !isNaN(Number(spoolId))) {
        // valid spool ID
        const id = parseInt(spoolId)

        if (this.availableSpools.some((spool: Spool) => spool.id === id)) {
          // spool exists in spoolman
          this.$emit('detected', id)
        } else {
          // spool doesn't exist
          this.statusMessage = 'error.spool_not_existant'
        }
      } else {
        this.statusMessage = 'warning.invalid_spool_id'
      }
    } else {
      this.statusMessage = 'warning.code_not_recognized'
    }
  }
}
</script>
