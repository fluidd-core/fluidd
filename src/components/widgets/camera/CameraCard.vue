<template>
  <collapsable-card
    :title="$tc('app.general.title.camera', 2)"
    icon="$camera"
    :lazy="false"
    draggable
    layout-path="dashboard.camera-card"
    @collapsed="collapsed = $event"
  >
    <template #menu>
      <camera-menu
        @select="handleCameraSelect"
      />
    </template>

    <v-row
      v-if="cameras.length > 1"
      justify="space-around"
      class="ma-2"
    >
      <template v-for="camera in cameras">
        <v-col
          v-if="!collapsed"
          :key="camera.id"
          cols="12"
          :sm="cols"
        >
          <camera-item
            :camera="camera"
          />
        </v-col>
      </template>
    </v-row>

    <camera-item
      v-if="!collapsed && cameras.length === 1"
      :camera="cameras[0]"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import CameraMenu from './CameraMenu.vue'
import StateMixin from '@/mixins/state'
// import type { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {
    CameraItem,
    CameraMenu
  }
})
export default class CameraCard extends Mixins(StateMixin) {
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

  get cameras () {
    return this.$store.getters['cameras/getVisibleCameras']
  }

  handleCameraSelect (cam: string) {
    this.$store.dispatch('cameras/updateActiveCamera', cam)
  }
}
</script>
