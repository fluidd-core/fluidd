<template>
  <app-dialog
    v-model="open"
    no-actions
    width="60vw"
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
        @frame="handlePrinterCameraFrame"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Ref, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import jsQR from 'jsqr'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import { Spool } from '@/store/spoolman/types'

@Component({
  components: { CameraItem }
})
export default class QRReader extends Mixins(StateMixin) {
  video!: HTMLVideoElement | HTMLImageElement
  context!: CanvasRenderingContext2D | null
  dataPatterns = [/\/spool\/show\/(\d+)\/?/]
  statusMessage = 'info.howto'

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

  mounted () {
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })
  }

  handlePrinterCameraFrame (image: HTMLVideoElement | HTMLImageElement) {
    if (!this.context) {
      return
    }

    if (image instanceof HTMLVideoElement) {
      this.canvas.width = image.videoWidth
      this.canvas.height = image.videoHeight
    } else {
      this.canvas.width = image.naturalWidth
      this.canvas.height = image.naturalHeight
    }

    try {
      this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
      this.readCodeFromCanvasContext()
    } catch {
      this.statusMessage = 'error.no_image_data'
    }
  }

  get availableSpools () {
    return this.$store.getters['spoolman/getAvailableSpools']
  }

  readCodeFromCanvasContext () {
    if (!this.context || !this.canvas.width || !this.canvas.height) {
      return
    }

    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code) {
      // valid QR code found
      const pattern = this.dataPatterns.find(pattern => pattern.test(code.data))
      if (pattern) {
        // code matches one of known patterns
        const spoolId = code.data.match(pattern)?.[1]
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
}
</script>
