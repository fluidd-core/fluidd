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
import type { WebcamConfig } from '@/store/webcams/types'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'

@Component({
  components: {
    CameraItem
  }
})
export default class FullscreenCamera extends Vue {
  camera: WebcamConfig | null = null

  created () {
    const cameraId = this.$route.params.cameraId
    const camera = this.$store.getters['webcams/getWebcamById'](cameraId) as WebcamConfig | undefined

    this.camera = camera ?? null
  }
}
</script>
