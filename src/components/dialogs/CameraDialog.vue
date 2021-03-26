<template>
  <v-dialog
    @input="$emit('input', $event)"
    :value="value"
    :width="640"
  >
    <camera
      :camera="camera"
    >
    </camera>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Camera from '@/components/widgets/camera/Camera.vue'

@Component({
  components: {
    Camera
  }
})
export default class CameraDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: Object, required: true })
  public camera!: Camera
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
