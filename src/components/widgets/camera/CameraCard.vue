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
          :key="camera.uid"
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
import type { WebcamConfig } from '@/store/webcams/types'

@Component({
  components: {
    CameraItem,
    CameraMenu
  }
})
export default class CameraCard extends Mixins(StateMixin) {
  collapsed = false

  get cols () {
    if (this.cameras.length === 1) return 12
    if (this.cameras.length <= 2) return 6
    if (this.cameras.length > 2) return 4
  }

  get cameras (): WebcamConfig[] {
    return this.$store.getters['webcams/getVisibleWebcams'] as WebcamConfig[]
  }

  handleCameraSelect (id: string) {
    this.$store.dispatch('webcams/updateActiveWebcam', id)
  }
}
</script>
