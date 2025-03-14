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

      <template v-for="camera in cameras">
        <v-divider :key="`divider-${camera.uid}`" />

        <app-setting
          :key="`camera-${camera.uid}`"
          :r-cols="2"
          :sub-title="camera.source === 'config' ? $t('app.general.tooltip.managed_by_moonraker') : undefined"
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
            icon
            @click.stop="handleEditDialog(camera)"
          >
            <v-icon dense>
              $edit
            </v-icon>
          </app-btn>

          <app-btn
            :disabled="camera.source === 'config'"
            icon
            @click.stop="handleRemoveCamera(camera)"
          >
            <v-icon dense>
              $delete
            </v-icon>
          </app-btn>
        </app-setting>
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
        v-if="dialogState.active"
        v-model="dialogState.active"
        :camera="dialogState.camera"
        @save="handleSaveCamera"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { WebcamConfig, NewWebcamConfig } from '@/store/webcams/types'
import CameraConfigDialog from './CameraConfigDialog.vue'
import { Globals } from '@/globals'

@Component({
  components: {
    CameraConfigDialog
  }
})
export default class CameraSettings extends Vue {
  dialogState: any = {
    active: false,
    camera: null
  }

  get cameras (): WebcamConfig[] {
    return this.$typedGetters['webcams/getWebcams']
  }

  handleEditDialog (camera: WebcamConfig) {
    this.dialogState = {
      active: true,
      camera: { ...camera }
    }
  }

  handleAddDialog () {
    const camera: NewWebcamConfig = {
      enabled: true,
      flip_horizontal: false,
      flip_vertical: false,
      name: '',
      rotation: 0,
      service: 'mjpegstreamer-adaptive',
      target_fps: 15,
      target_fps_idle: 5,
      stream_url: Globals.DEFAULTS.CAMERA_URL_STREAM,
      snapshot_url: Globals.DEFAULTS.CAMERA_URL_SNAPSHOT
    }

    this.dialogState = {
      active: true,
      camera
    }
  }

  handleSaveCamera (camera: WebcamConfig) {
    this.$store.dispatch('webcams/updateWebcam', camera)
  }

  async handleRemoveCamera (camera: WebcamConfig) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_camera', { name: camera.name }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$store.dispatch('webcams/removeWebcam', camera.uid)
    }
  }

  get defaultFullscreenAction (): string {
    return this.$typedState.config.uiSettings.general.cameraFullscreenAction
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
