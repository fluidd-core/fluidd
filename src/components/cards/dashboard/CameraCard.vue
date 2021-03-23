<template>
  <collapsable-card
    :title="$t('app.general.title.camera')"
    icon="$camera"
    :lazy="false"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)"
    @collapsed="onCollapse">

    <img
      v-if="streamType === 'mjpgstreamer'"
      :src="cameraUrlCacheBusted"
      class="webcam"
      :style="cameraTransforms"
    />

    <video
      v-if="streamType === 'ipcamera'"
      :src="cameraUrl"
      autoplay
      class="webcam"
      :style="cameraTransforms"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    PrintStatusWidget
  }
})
export default class CameraCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  cameraUrl = ''
  cameraUrlCacheBusted = ''
  refresh = new Date().getTime()

  // Provides a cachebusted Url
  get cacheBustedUrl () {
    const hostUrl = new URL(document.URL)
    const url = new URL(this.url, hostUrl.origin)
    url.searchParams.append('cacheBust', this.refresh.toString())
    return url.toString()
  }

  // Provides the plain Url
  get url () {
    return this.config.url
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
    this.cameraUrlCacheBusted = ''
    document.removeEventListener('visibilitychange', this.handleRefreshChange)
  }

  onCollapse (collapsed: boolean) {
    if (collapsed) {
      this.cameraUrl = ''
      this.cameraUrlCacheBusted = ''
    } else {
      this.cameraUrl = this.url
      this.cameraUrlCacheBusted = this.cacheBustedUrl
    }
  }

  handleRefreshChange () {
    if (!document.hidden) {
      this.refresh = new Date().getTime()
      this.cameraUrl = this.url
      this.cameraUrlCacheBusted = this.cacheBustedUrl
    } else {
      this.cameraUrl = ''
      this.cameraUrlCacheBusted = ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    width: 100%;
  }
</style>
