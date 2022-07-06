<template>
  <div v-if="camera">
    <CameraItem
      :camera="camera"
      :fullscreen="true"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'

@Component({
  components: {
    CameraItem
  }
})
export default class FullscreenCamera extends Vue {
  cameraId?: string
  camera?: CameraConfig

  created () {
    this.cameraId = this.$route.params.cameraId
    this.camera = this.$store.getters['cameras/getCameras'].find((camera: CameraConfig) => camera.id === this.cameraId)
  }
}
</script>
