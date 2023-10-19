<template>
  <v-dialog
    v-model="open"
    max-width="90vh"
  >
    <camera-item
      :camera="camera"
    />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import type { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {
    CameraItem
  }
})
export default class CameraDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig
}
</script>

<style lang="scss" scoped>
  .config-editor-overlay div.v-card {
    position: relative;
    header {
      position: sticky;
      top: 0;
      width: 100%;
      z-index: 1;
    }
  }
</style>
