import Vue from 'vue'
import { Component, Prop, Ref } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'

@Component
export default class CameraMixin extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  @Ref('streamingElement')
  readonly streamingElement!: HTMLImageElement | HTMLIFrameElement | HTMLVideoElement

  cameraTransformStyle = ''
  animating = false

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  get cameraUrl () {
    const baseUrl = this.camera.urlStream || this.camera.urlSnapshot || ''

    const { origin } = new URL(this.apiUrl)

    return new URL(baseUrl, origin).toString()
  }

  get cameraStyle () {
    return {
      transform: this.cameraTransformStyle || undefined
    }
  }

  createTransform () {
    const element = this.streamingElement
    const { rotation, flipX, flipY } = this.camera
    const transformsArray: string[] = []

    const scale = rotation === 0 || rotation === 180
      ? 1
      : element.clientHeight < element.clientWidth
        ? element.clientHeight / element.clientWidth
        : element.clientWidth / element.clientHeight

    if (scale !== 1 || flipX) {
      transformsArray.push(`scaleX(${flipX ? -scale : scale})`)
    }

    if (scale !== 1 || flipY) {
      transformsArray.push(`scaleY(${flipY ? -scale : scale})`)
    }

    if (rotation !== 0) {
      transformsArray.push(`rotate(${rotation}deg`)
    }

    return transformsArray.join(' ')
  }

  updateCameraTransformStyle () {
    requestAnimationFrame(() => {
      if (!this.animating) {
        return
      }

      if (this.streamingElement) {
        this.cameraTransformStyle = this.createTransform()
      }

      this.updateCameraTransformStyle()
    })
  }

  created () {
    this.animating = true
    this.updateCameraTransformStyle()
  }

  mounted () {
    document.addEventListener('visibilitychange', this.checkPlayback, false)
    this.checkPlayback()
  }

  beforeDestroy () {
    this.animating = false
    document.removeEventListener('visibilitychange', this.checkPlayback)
    this.stopPlayback()
  }

  checkPlayback () {
    if (!document.hidden) {
      this.startPlayback()
    } else {
      this.stopPlayback()
    }
  }

  startPlayback () {
    // noop
  }

  stopPlayback () {
    // noop
  }
}
