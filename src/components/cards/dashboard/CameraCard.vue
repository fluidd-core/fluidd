<template>
  <collapsable-card
    :title="$tc('app.general.title.camera', 2)"
    icon="$camera"
    :lazy="false"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)"
    @collapsed="collapsed = $event">

    <camera-dialog
      v-if="dialogState.camera"
      v-model="dialogState.open"
      :camera="dialogState.camera"
    ></camera-dialog>

    <v-row class="ma-2" justify="space-around">
      <template v-for="camera in cameras">
        <v-col
          v-if="!collapsed"
          cols="12" :sm="cols"
          :key="camera.id">
          <camera
            :camera="camera"
            @click="handleCameraClick(camera)"
          ></camera>
        </v-col>
      </template>
    </v-row>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import Camera from '@/components/widgets/camera/Camera.vue'
import CameraDialog from '@/components/dialogs/CameraDialog.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    Camera,
    CameraDialog
  }
})
export default class CameraCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  dialogState: any = {
    open: false,
    camera: null
  }

  collapsed = false

  get cols () {
    if (this.cameras.length <= 2) return 6
    if (this.cameras.length > 2) return 4
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get cameras () {
    return this.$store.getters['cameras/getVisibleCameras']
  }

  handleCameraClick (camera: Camera) {
    this.dialogState = {
      open: true,
      camera
    }
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    display: block;
    width: 100%;
  }
</style>
