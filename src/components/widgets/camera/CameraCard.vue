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

    <v-row
      v-if="cameras.length > 1 || !fillSpace"
      class="ma-2"
      justify="space-around"
    >
      <template v-for="camera in cameras">
        <v-col
          v-if="!collapsed"
          cols="12" :sm="cols"
          :key="camera.id">
          <camera-item
            :camera="camera"
            @click="handleCameraClick(camera)"
          ></camera-item>
        </v-col>
      </template>
    </v-row>
    <camera-item
      v-if="!collapsed && fillSpace && cameras.length === 1"
      :camera="cameras[0]"
      flat
      @click="handleCameraClick(cameras[0])"
    ></camera-item>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import CameraDialog from '@/components/widgets/camera/CameraDialog.vue'
import StateMixin from '@/mixins/state'
import { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {
    CameraItem,
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
    if (this.fillSpace) return 12
    if (this.cameras.length <= 2) return 6
    if (this.cameras.length > 2) return 4
  }

  get fillSpace (): boolean {
    return this.$store.state.cameras.fillSpace && this.cameras.length === 1
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get cameras () {
    return this.$store.getters['cameras/getVisibleCameras']
  }

  handleCameraClick (camera: CameraConfig) {
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
