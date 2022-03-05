<template>
  <v-dialog
    @input="$emit('input', $event)"
    :value="value"
    max-width="90vh"
  >
    <camera-item
      :camera="camera"
    />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {
    CameraItem
  }
})
export default class CameraDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: Object, required: true })
  public camera!: CameraConfig
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
