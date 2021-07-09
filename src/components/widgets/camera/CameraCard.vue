<template>
  <collapsable-card
    :title="$tc('app.general.title.camera', 2)"
    icon="$camera"
    :lazy="false"
    :draggable="true"
    layout-path="dashboard.camera-card"
    @collapsed="collapsed = $event">

    <template v-slot:menu>
      <camera-menu
        @select="handleCameraSelect"
      ></camera-menu>
    </template>

    <v-row
      v-if="cameras.length > 1"
      justify="space-around"
      class="ma-2"
    >
      <template v-for="camera in cameras">
        <v-col
          v-if="!collapsed"
          cols="12" :sm="cols"
          :key="camera.id"
        >
          <camera-item
            :camera="camera"
          ></camera-item>
        </v-col>
      </template>
    </v-row>

    <camera-item
      v-if="!collapsed && cameras.length === 1"
      :camera="cameras[0]"
    ></camera-item>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import CameraMenu from './CameraMenu.vue'
import StateMixin from '@/mixins/state'
// import { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {
    CameraItem,
    CameraMenu
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
    if (this.cameras.length === 1) return 12
    if (this.cameras.length <= 2) return 6
    if (this.cameras.length > 2) return 4
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get cameras () {
    return this.$store.getters['cameras/getVisibleCameras']
  }

  handleCameraSelect (cam: string) {
    this.$store.dispatch('cameras/updateActiveCamera', cam)
  }
}
</script>
