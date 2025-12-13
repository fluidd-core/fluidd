<template>
  <v-card
    v-if="camera"
    class="overflow-hidden"
  >
    <CameraItem
      :camera="camera"
      fullscreen
    />
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'

@Component({
  components: {
    CameraItem
  }
})
export default class FullscreenCamera extends Vue {
  camera: Moonraker.Webcam.Entry | null = null

  created () {
    const cameraId = this.$route.params.cameraId
    const camera: Moonraker.Webcam.Entry | undefined = this.$typedGetters['webcams/getWebcamById'](cameraId)

    this.camera = camera ?? null
  }
}
</script>
