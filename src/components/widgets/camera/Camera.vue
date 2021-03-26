<template>
  <v-card
    color="secondary"
    :elevation="6"
    v-on="$listeners"
  >
    <img
      v-if="camera.type === 'mjpgstream' || camera.type === 'mjpgadaptive'"
      :src="cameraUrl"
      class="webcam"
      :style="cameraTransformStyle"
      @load="handleImgLoad"
    />

    <video
      v-if="camera.type === 'ipstream'"
      :src="cameraUrl"
      autoplay
      class="webcam"
      :style="cameraTransformStyle"
    />

    <v-card-text
      v-if="camera.name"
      class="card-heading py-1 d-flex align-center justify-space-between"
    >
      <span class="font-weight-light" style="font-size: 1.0rem;">{{ camera.name }}</span>
      <small v-if="this.camera.type === 'mjpgadaptive' && this.time">FPS: {{ currentFPS }}</small>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'

/**
 * Adaptive load credit to https://github.com/Rejdukien
 */
@Component({})
export default class CameraCard extends Vue {
  @Prop({ type: Object, required: true })
  camera!: CameraConfig

  // Adaptive load counters
  request_start_time = performance.now()
  start_time = performance.now()
  time = 0
  request_time = 0
  time_smoothing = 0.6
  request_time_smoothing = 0.1
  currentFPS = 0

  // URL used by camera
  cameraUrl = ''

  // Maintains the last cachebust string
  refresh = new Date().getTime()

  /**
   * Handle any transforms the user may have set on the camera image.
   */
  get cameraTransformStyle () {
    const config = this.camera
    let transforms = ''
    transforms += (config && config.flipX) ? ' scaleX(-1)' : ''
    transforms += (config && config.flipY) ? ' scaleY(-1)' : ''
    // transforms += ` rotate(${config.rotate}deg)`
    return (transforms.trimLeft().length) ? { transform: transforms.trimLeft() } : {}
  }

  /**
   * On creation, set the initial urls and bind the visibility listener.
   */
  created () {
    this.setUrl()
    document.addEventListener('visibilitychange', this.handleRefresh, false)
  }

  /**
   * make sure to clear the URL and remove the listener when we destroy the
   * component.
   */
  beforeDestroy () {
    this.cameraUrl = ''
    document.removeEventListener('visibilitychange', this.handleRefresh)
  }

  /**
   * For image based streams / adaptive loads, set the refresh token
   * and set the new cachebusted url.
   */
  handleRefresh () {
    if (!document.hidden) {
      this.refresh = new Date().getTime()
      this.setUrl()
    } else {
      this.cameraUrl = ''
    }
  }

  /**
   * Handles the reload of the image, forces a new cachebust and sets the
   * performance counters for the next load.
   * It only used for the adaptive load type.
   */
  handleImgLoad () {
    if (
      this.camera &&
      this.camera.type === 'mjpgadaptive'
    ) {
      const fpsTarget = this.camera.fpstarget || 10
      const end_time = performance.now()
      const current_time = end_time - this.start_time
      this.time = (this.time * this.time_smoothing) + (current_time * (1.0 - this.time_smoothing))
      this.start_time = end_time

      const target_time = 1000 / fpsTarget

      const current_request_time = performance.now() - this.request_start_time
      this.request_time = (this.request_time * this.request_time_smoothing) + (current_request_time * (1.0 - this.request_time_smoothing))
      const timeout = Math.max(0, target_time - this.request_time)

      this.$nextTick(() => {
        setTimeout(this.handleRefresh, timeout)
      })
    }
  }

  /**
   * Sets the correct (cachebusted if applicable) camera url.
   */
  setUrl () {
    const type = this.camera.type
    const baseUrl = this.camera.url
    const hostUrl = new URL(document.URL)
    const url = new URL(baseUrl, hostUrl.origin)

    if (type === 'mjpgstream') {
      url.searchParams.append('cacheBust', this.refresh.toString())
      url.searchParams.set('action', 'stream')
      this.cameraUrl = url.toString()
    }

    if (type === 'mjpgadaptive') {
      this.request_start_time = performance.now()
      url.searchParams.append('cacheBust', this.refresh.toString())
      url.searchParams.set('action', 'snapshot')
      this.currentFPS = Math.round(1000 / this.time)
      this.$nextTick(() => {
        this.cameraUrl = url.toString()
      })
    }

    if (type === 'ipstream') {
      this.cameraUrl = baseUrl
    }
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    display: block;
    transform-origin: top left;
    width: 100%;
    white-space: nowrap;
  }
</style>
