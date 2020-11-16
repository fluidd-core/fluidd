<template>
  <collapsable-card
    title="Camera"
    icon="$camera"
    :collapsed="true">

    <img :src="cameraUrl" class="webcam" :style="cameraTransforms" v-if="streamType === 'mjpgstreamer'" />
    <video :src="cameraUrl" autoplay class="webcam" :style="cameraTransforms" v-if="streamType === 'ipcamera'" />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    PrintStatusWidget
  }
})
export default class CameraCard extends Mixins(UtilsMixin) {
  get streamType () {
    return this.$store.state.config.fileConfig.camera.type
  }

  get cameraUrl (): string {
    return this.$store.state.config.fileConfig.camera.url
  }

  get cameraTransforms () {
    const config = this.$store.state.config.fileConfig.camera
    let transforms = ''
    transforms += (config && config.flipX) ? ' scaleX(-1)' : ''
    transforms += (config && config.flipY) ? ' scaleY(-1)' : ''
    return (transforms.trimLeft().length) ? { transform: transforms.trimLeft() } : {}
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    width: 100%;
  }
</style>
