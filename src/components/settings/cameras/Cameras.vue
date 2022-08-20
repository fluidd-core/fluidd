<template>
  <div>
    <v-subheader id="camera">
      {{ $tc('app.setting.title.camera', 2) }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <app-btn
          :disabled="cameras.length >= 3"
          outlined
          small
          color="primary"
          @click="handleAddDialog"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_camera') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <template v-for="(camera, i) in cameras">
        <app-setting
          :key="camera.id"
          :r-cols="2"
          @click="handleEditDialog(camera)"
        >
          <template #title>
            {{ camera.name }} <v-icon
              v-if="!camera.enabled"
              right
              small
              color="warning"
            >
              $warning
            </v-icon>
          </template>
          <app-btn
            fab
            text
            x-small
            color=""
            :disabled="camera.source === 'config'"
            @click.stop="handleRemoveCamera(camera)"
          >
            <v-icon
              v-if="camera.source === 'config'"
              color=""
            >
              $lock
            </v-icon>
            <v-icon
              v-else
              color=""
            >
              $close
            </v-icon>
          </app-btn>
        </app-setting>

        <v-divider
          v-if="i < cameras.length - 1 && cameras.length > 0"
          :key="camera.id + '_divider'"
        />
      </template>

      <v-divider />

      <app-setting :title="$t('app.setting.label.camera_fullscreen_action.title')">
        <v-select
          v-model="defaultFullscreenAction"
          filled
          dense
          hide-details
          :items="[
            {
              text: $t('app.setting.label.camera_fullscreen_action.embed'),
              value: 'embed',
            },{
              text: $t('app.setting.label.camera_fullscreen_action.rawstream'),
              value: 'rawstream',
            }
          ]"
        />
      </app-setting>

      <camera-config-dialog
        v-if="dialogState.camera"
        v-model="dialogState.active"
        :camera="dialogState.camera"
        @save="handleSaveCamera"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'
import CameraConfigDialog from './CameraConfigDialog.vue'
import { Globals } from '@/globals'
import AppSetting from '@/components/ui/AppSetting.vue'

@Component({
  components: {
    AppSetting,
    CameraConfigDialog
  }
})
export default class CameraSettings extends Vue {
  dialogState: any = {
    active: false,
    camera: null
  }

  get cameras (): CameraConfig[] {
    return this.$store.getters['cameras/getCameras']
  }

  handleEditDialog (camera: CameraConfig) {
    if (camera.source === 'config') {
      return
    }

    this.dialogState = {
      active: true,
      camera: { ...camera }
    }
  }

  handleAddDialog () {
    const camera = {
      id: '',
      enabled: true,
      flipX: false,
      flipY: false,
      name: '',
      service: 'mjpegstreamer-adaptive',
      targetFps: 15,
      targetFpsIdle: 5,
      urlStream: Globals.DEFAULTS.CAMERA_URL
    } as CameraConfig

    this.dialogState = {
      active: true,
      camera
    }
  }

  handleSaveCamera (camera: CameraConfig) {
    this.$store.dispatch('cameras/updateCamera', camera)
  }

  handleRemoveCamera (camera: CameraConfig) {
    this.$store.dispatch('cameras/removeCamera', camera)
  }

  get defaultFullscreenAction (): string {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction
  }

  set defaultFullscreenAction (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.cameraFullscreenAction',
      value,
      server: true
    })
  }
}
</script>
