<template>
  <v-card
    v-if="camera"
    class="overflow-hidden"
  >
    <CameraItem
      :camera="camera"
      :fullscreen="true"
    />
  </v-card>
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
  cameraId: string | null = null
  camera: CameraConfig | null = null

  created () {
    this.cameraId = this.$route.params.cameraId
    this.camera = this.$store.getters['cameras/getCameras'].find((camera: CameraConfig) => camera.id === this.cameraId)
  }
}
</script>
