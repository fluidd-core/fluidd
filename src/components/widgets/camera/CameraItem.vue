<template>
  <v-sheet
    :elevation="0"
    rounded
    class="camera-container"
    v-on="$listeners"
  >
    <img
      v-if="camera.service === 'mjpegstreamer' || camera.service === 'mjpegstreamer-adaptive'"
      ref="camera_image"
      :src="cameraUrl"
      class="camera-image"
      @load="handleImgLoad"
    >

    <video
      v-if="camera.service === 'ipstream'"
      ref="camera_image"
      :src="cameraUrl"
      autoplay
      class="camera-image"
    />

    <iframe
      v-if="camera.service === 'iframe'"
      ref="camera_image"
      :src="cameraUrl"
      class="camera-image"
      style="border: none; width: 100%"
      :style="{
        height: (cameraHeight && !camera.aspectRatio) ? (fullscreen ? '100vh' : `${cameraHeight}px`) : undefined,
        'aspect-ratio': camera.aspectRatio ? camera.aspectRatio.replace(':', '/') : undefined,
        'max-height': camera.aspectRatio ? 'unset' : undefined
      }"
    />

    <div
      v-if="camera.name"
      class="camera-name"
    >
      {{ camera.name }}
    </div>
    <div
      v-if="camera.service === 'mjpegstreamer-adaptive' && time"
      class="camera-frames"
    >
      fps: {{ currentFPS }}
    </div>
    <div
      v-if="cameraFullScreenUrl && (!fullscreen || fullscreenMode === 'embed')"
      class="camera-fullscreen"
    >
      <a
        :href="cameraFullScreenUrl"
        :target="fullscreen || fullscreenMode === 'rawstream' ? '_blank' : ''"
      >
        <v-icon>${{ (fullscreen || fullscreenMode === 'rawstream') ? 'openInNew' : 'fullScreen' }}</v-icon>
      </a>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'
import { noop } from 'vue-class-component/lib/util'
import { CameraFullscreenAction } from '@/store/config/types'

/**
 * Adaptive load credit to https://github.com/Rejdukien
 */
@Component({})
export default class CameraItem extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  @Prop({ type: Boolean, required: false, default: false })
  readonly fullscreen!: boolean

  @Ref('camera_image')
  readonly cameraImage!: HTMLImageElement

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
  cameraFullScreenUrl = ''

  // iframe height, deprecated
  cameraHeight = 720

  // Maintains the last cachebust string
  refresh = new Date().getTime()

  // Callback to cancel requestAnimationFrame() when component is being destroyed.
  cancelCameraTransform = noop

  /**
   * Handle any transforms the user may have set on the camera image.
   */
  cameraTransformStyle (element: HTMLElement) {
    const config = this.camera
    let transforms = ''

    if (config.rotation === 0) {
      transforms += config && config.flipX ? ' scaleX(-1)' : ''
      transforms += config && config.flipY ? ' scaleY(-1)' : ''
    } else {
      let scaling = 1
      if (config.rotation !== 180) {
        scaling = element.clientHeight / element.clientWidth
        if (scaling > 1) {
          scaling = element.clientWidth / element.clientHeight
        }
      }

      transforms += config && config.flipX ? ` scaleX(-${scaling})` : ` scaleX(${scaling})`
      transforms += config && config.flipY ? ` scaleY(-${scaling})` : ` scaleY(${scaling})`
      transforms += ` rotate(${config.rotation}deg)`
    }

    return transforms.trimLeft().length
      ? { transform: transforms.trimLeft() }
      : {}
  }

  @Watch('camera', { immediate: true })
  onCameraChange () {
    this.setUrl()
    if (!this.fullscreen && this.fullscreenMode === 'embed') {
      this.cameraFullScreenUrl = `/#/camera/${this.camera.id}`
    }
  }

  /**
   * On creation, set the initial urls and bind the visibility listener.
   */
  created () {
    document.addEventListener('visibilitychange', this.setUrl, false)
    this.cancelCameraTransform = this.createTransformAnimation()
  }

  /**
   * make sure to clear the URL and remove the listener when we destroy the
   * component.
   */
  beforeDestroy () {
    this.cancelCameraTransform()
    this.cameraUrl = this.cameraImage.src = ''
    this.cameraFullScreenUrl = ''
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
        this.request_start_time = performance.now()
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
      this.camera.service === 'mjpegstreamer-adaptive'
    ) {
      const fpsTarget = (!document.hasFocus() && this.camera.targetFpsIdle) || this.camera.targetFps || 10
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
      const type = this.camera.service
      const baseUrl = this.camera.urlStream || this.camera.urlSnapshot || ''
      const hostUrl = new URL(document.URL)
      const url = new URL(baseUrl, hostUrl.origin)

      this.cameraHeight = this.camera.height || 720

      if (type === 'mjpegstreamer') {
        url.searchParams.append('cacheBust', this.refresh.toString())
        if (!url.searchParams.get('action')?.startsWith('stream')) {
          url.searchParams.set('action', 'stream')
        }
        this.cameraUrl = url.toString()
        if (!this.cameraFullScreenUrl) {
          this.cameraFullScreenUrl = this.cameraUrl
        }
      }

      if (type === 'mjpegstreamer-adaptive') {
        this.request_start_time = performance.now()
        url.searchParams.append('cacheBust', this.refresh.toString())
        if (!url.searchParams.get('action')?.startsWith('snapshot')) {
          url.searchParams.set('action', 'snapshot')
        }
        this.cameraUrl = url.toString()
        if (!this.cameraFullScreenUrl) {
          url.searchParams.set('action', 'stream')
          this.cameraFullScreenUrl = url.toString()
        }
      }

      if (type === 'ipstream' || type === 'iframe') {
        this.cameraUrl = baseUrl
        if (!this.cameraFullScreenUrl) {
          this.cameraFullScreenUrl = baseUrl
        }
      }
    } else {
      this.cameraUrl = ''
    }
  }

  /**
   * Calls `requestAnimationFrame` indefinitely to apply camera transformations.
   * The call to `requestAnimationFrame` is required because of the dependency
   * on loaded node sizes in the document.
   */
  createTransformAnimation () {
    let animating = true

    const animate = () => {
      requestAnimationFrame(() => {
        if (!animating) {
          return
        }

        const image = this.cameraImage

        if (image) {
          // Call to Object.assign() might not be suitable here.
          Object.assign(image.style, this.cameraTransformStyle(image))
        }

        animate()
      })
    }

    animate()

    return () => {
      animating = false
    }
  }

  get fullscreenMode (): CameraFullscreenAction {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction
  }
}
</script>

<style lang="scss" scoped>
  .camera-image {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 56px - 32px);
    white-space: nowrap;
    margin: auto;
  }

  .camera-container {
    position: relative;
    background: rgba(0, 0, 0, 1);
  }

  .camera-name,
  .camera-frames {
    position: absolute;
    bottom: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    font-weight: 100;
  }

  .theme--light .camera-name,
  .theme--light .camera-frames {
    background: rgba(255, 255, 255, 0.75);
  }

  .camera-fullscreen {
    position: absolute;
    text-align: right;
    top: 0;
    right: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
  }

  .theme--light .camera-fullscreen {
    background: rgba(255, 255, 255, 0.75);
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
