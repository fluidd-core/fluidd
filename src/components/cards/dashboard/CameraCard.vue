<template>
  <collapsable-card
    :title="$t('Camera')"
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

  beforeDestroy () {
    this.cameraUrl = ''
  }

  onCollapse (collapsed: boolean) {
    if (collapsed) {
      this.cameraUrl = ''
    } else {
      this.cameraUrl = this.$store.state.config.fileConfig.camera.url
    }
  }

  get streamType () {
    return this.$store.state.config.fileConfig.camera.type
  }

  get cameraTransforms () {
    const config = this.$store.state.config.fileConfig.camera
    let transforms = ''
    transforms += (config && config.flipX) ? ' scaleX(-1)' : ''
    transforms += (config && config.flipY) ? ' scaleY(-1)' : ''
    return (transforms.trimLeft().length) ? { transform: transforms.trimLeft() } : {}
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    width: 100%;
  }
</style>
