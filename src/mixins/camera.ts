import Vue from 'vue'
import { Component, Prop, Ref, Watch } from 'vue-property-decorator'
import type { CameraConfig } from '@/store/cameras/types'

@Component
export default class CameraMixin extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  @Prop({ type: String })
  readonly crossorigin?: 'anonymous' | 'use-credentials' | ''

  @Ref('streamingElement')
  readonly streamingElement!: HTMLImageElement | HTMLIFrameElement | HTMLVideoElement

  cameraTransformStyle = ''
  animating = false

  @Watch('camera')
  onCamera () {
    this.stopPlayback()
    this.checkPlayback()
  }

  get apiUrl (): string {
    return this.$store.state.config.apiUrl as string
  }

  get cameraStyle () {
    return {
      transform: this.cameraTransformStyle || undefined
    }
  }

  createTransform (): string {
    const element = this.streamingElement
    const { rotation, flipX, flipY } = this.camera
    const transformsArray: string[] = []

    const { clientWidth, clientHeight } = element

    const scale = (
      rotation === 0 ||
      rotation === 180 ||
      clientHeight === 0 ||
      clientWidth === 0
    )
      ? 1
      : clientHeight < clientWidth
        ? clientHeight / clientWidth
        : clientWidth / clientHeight

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

  buildAbsoluteUrl (url: string) {
    const { origin } = new URL(document.URL)

    return new URL(url, origin)
  }

  startPlayback () {
    // noop
  }

  stopPlayback () {
    // noop
  }
}
