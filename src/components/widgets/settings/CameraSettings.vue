<template>
  <div>
    <v-subheader id="camera">{{ $tc('app.setting.title.camera', 2) }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <fluidd-setting>
        <btn
          @click="handleAddDialog"
          :disabled="cameras.length >= 3"
          outlined
          small
          color="primary">
          <v-icon small left>$plus</v-icon>
          {{ $t('app.setting.btn.add_camera') }}
        </btn>
      </fluidd-setting>

      <v-divider v-if="cameras.length > 0"></v-divider>

      <template v-for="(camera, i) in cameras">
        <fluidd-setting
          :key="camera.id"
          :title="camera.name"
          @click="handleEditDialog(camera)"
          :r-cols="2"
        >
          <btn
            @click.stop="handleRemoveCamera(camera)"
            fab
            text
            x-small
            color="">
            <v-icon color="grey--text">$close</v-icon>
          </btn>
        </fluidd-setting>

        <v-divider :key="camera.id + '_divider'" v-if="i < cameras.length - 1 && cameras.length > 0"></v-divider>
      </template>

      <camera-config-dialog
        v-if="dialogState.camera"
        v-model="dialogState.active"
        :camera="dialogState.camera"
        @save="handleSaveCamera"
      ></camera-config-dialog>

    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'
import CameraConfigDialog from '@/components/dialogs/CameraConfigDialog.vue'
import { Globals } from '@/globals'

@Component({
  components: {
    CameraConfigDialog
  }
})
export default class CameraSettingsCard extends Vue {
  dialogState: any = {
    active: false,
    camera: null
  }

  get cameras () {
    return this.$store.getters['cameras/getCameras']
  }

  handleEditDialog (camera: CameraConfig) {
    this.dialogState = {
      active: true,
      camera: { ...camera }
    }
  }

  handleAddDialog () {
    const camera: any = {
      id: -1,
      enabled: true,
      flipX: false,
      flipY: false,
      name: '',
      type: 'mjpgadaptive',
      fpstarget: 15,
      url: Globals.DEFAULTS.CAMERA_URL
    }

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
}
</script>
