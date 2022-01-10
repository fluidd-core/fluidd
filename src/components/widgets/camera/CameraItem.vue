<template>
  <div>
    <v-sheet
      :elevation="0"
      rounded
      v-on="$listeners"
      class="camera-container"
    >
      <img
        v-if="camera.type === 'mjpgstream' || camera.type === 'mjpgadaptive'"
        :src="cameraUrl"
        class="camera-image"
        :style="cameraTransformStyle"
        @load="handleImgLoad"
      />

      <video
        v-if="camera.type === 'ipstream'"
        :src="cameraUrl"
        autoplay
        class="camera-image"
        :style="cameraTransformStyle"
      />

      <iframe
        v-if="camera.type === 'iframe'"
        :src="cameraUrl"
        class="camera-image"
        :style="cameraTransformStyle"
        :height="cameraHeight"
        frameBorder="0"
      />

      <div
        v-if="camera.name"
        class="camera-name"
      >
        {{ camera.name }}
      </div>
      <div
        v-if="this.camera.type === 'mjpgadaptive' && this.time"
        class="camera-frames"
      >
        fps: {{ currentFPS }}
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'

/**
 * Adaptive load credit to https://github.com/Rejdukien
 */
@Component({})
export default class CameraItem extends Vue {
  @Prop({ type: Object, required: true })
  camera!: CameraConfig

  // Adaptive load counters
  request_start_time = performance.now()
  start_time = performance.now()
  time = 0
  request_time = 0
  time_smoothing = 0.6
  request_time_smoothing = 0.1
  currentFPS = '0'

  // URL used by camera
  cameraUrl = ''

  // iframe height
  cameraHeight = 720

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

  @Watch('camera', { immediate: true })
  onCameraChange () {
    this.setUrl()
  }

  /**
   * On creation, set the initial urls and bind the visibility listener.
   */
  created () {
    document.addEventListener('visibilitychange', this.setUrl, false)
  }

  /**
   * make sure to clear the URL and remove the listener when we destroy the
   * component.
   */
  beforeDestroy () {
    this.cameraUrl = ''
    document.removeEventListener('visibilitychange', this.setUrl)
  }

  /**
   * For image based streams / adaptive loads, set the refresh token
   * and set the new cachebusted url.
   */
  handleRefresh () {
    if (!document.hidden) {
      this.refresh = new Date().getTime()
      // this.setUrl()
      this.currentFPS = Math.round(1000 / this.time).toLocaleString(undefined, { minimumIntegerDigits: 2 })
      this.$nextTick(() => {
        const hostUrl = new URL(document.URL)
        const url = new URL(this.cameraUrl, hostUrl.origin)
        url.searchParams.set('cacheBust', this.refresh.toString())
        this.cameraUrl = url.toString()
      })
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
    if (!document.hidden) {
      const type = this.camera.type
      const baseUrl = this.camera.url
      const hostUrl = new URL(document.URL)
      const url = new URL(baseUrl, hostUrl.origin)

      this.cameraHeight = this.camera.height || 720

      if (type === 'mjpgstream') {
        url.searchParams.append('cacheBust', this.refresh.toString())
        if (!url.searchParams.get('action')?.startsWith('stream')) {
          url.searchParams.set('action', 'stream')
        }
        this.cameraUrl = url.toString()
      }

      if (type === 'mjpgadaptive') {
        this.request_start_time = performance.now()
        url.searchParams.append('cacheBust', this.refresh.toString())
        if (!url.searchParams.get('action')?.startsWith('snapshot')) {
          url.searchParams.set('action', 'snapshot')
        }
        this.cameraUrl = url.toString()
      }

      if (type === 'ipstream' || type === 'iframe') {
        this.cameraUrl = baseUrl
      }
    } else {
      this.cameraUrl = ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .camera-image {
    display: block;
    width: 100%;
    white-space: nowrap;
  }

  .camera-container {
    position: relative;
  }

  .camera-name,
  .camera-frames {
    position: absolute;
    bottom: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    font-weight: 100;
  }

  .camera-name {
    left: 0;
    border-top-right-radius: 4px;
  }

  .camera-frames {
    text-align: right;
    right: 0;
    border-top-left-radius: 4px;
  }
</style>
