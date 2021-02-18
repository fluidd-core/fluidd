<template>
  <collapsable-card
    title="Camera"
    icon="$camera"
    :lazy="false"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)"
    @collapsed="onCollapse">

    <img :src="cameraUrl" class="webcam" :style="cameraTransforms" v-if="streamType === 'mjpgstreamer'" />
    <video :src="cameraUrl" autoplay class="webcam" :style="cameraTransforms" v-if="streamType === 'ipcamera'" />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    PrintStatusWidget
  }
})
export default class CameraCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  cameraUrl = ''
  refresh = new Date().getTime()

  get url () {
    const hostUrl = new URL(document.URL)
    const url = new URL(this.$store.state.config.uiSettings.camera.url, hostUrl.origin)
    url.searchParams.append('cacheBust', this.refresh.toString())
    return url.toString()
  }

  get config () {
    return this.$store.state.config.uiSettings.camera
  }

  get streamType () {
    return this.config.type
  }

  get cameraTransforms () {
    const config = this.config
    let transforms = ''
    transforms += (config && config.flipX) ? ' scaleX(-1)' : ''
    transforms += (config && config.flipY) ? ' scaleY(-1)' : ''
    return (transforms.trimLeft().length) ? { transform: transforms.trimLeft() } : {}
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  created () {
    document.addEventListener('visibilitychange', this.handleRefreshChange, false)
  }

  beforeDestroy () {
    this.cameraUrl = ''
    document.removeEventListener('visibilitychange', this.handleRefreshChange)
  }

  onCollapse (collapsed: boolean) {
    if (collapsed) {
      this.cameraUrl = ''
    } else {
      this.cameraUrl = this.url
    }
  }

  handleRefreshChange () {
    if (!document.hidden) {
      this.refresh = new Date().getTime()
      this.cameraUrl = this.url
    } else {
      this.cameraUrl = ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    width: 100%;
  }
</style>
