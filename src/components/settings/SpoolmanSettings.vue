<template>
  <div>
    <v-subheader id="spoolman">
      {{ $t('app.setting.title.spoolman') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        :title="$t('app.spoolman.setting.show_spool_selection_dialog_on_print_start')"
      >
        <v-switch
          v-model="autoSpoolSelectionDialog"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$tc('app.spoolman.setting.auto_open_qr_camera')"
      >
        <v-select
          v-model="autoOpenQRDetectionCameraId"
          filled
          dense
          single-line
          hide-details="auto"
          :items="supportedCameras"
        />
      </app-setting>

      <v-divider />
      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { defaultState } from '@/store/config/state'
import StateMixin from '@/mixins/state'
import { CameraConfig } from '@/store/cameras/types'

@Component({
  components: {}
})
export default class SpoolmanSettings extends Mixins(StateMixin) {
  get autoSpoolSelectionDialog (): boolean {
    return this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog
  }

  set autoSpoolSelectionDialog (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.autoSpoolSelectionDialog',
      value,
      server: true
    })
  }

  get supportedCameras () {
    return [
      { text: this.$tc('app.setting.label.none', 0), value: null },
      ...this.$store.getters['cameras/getEnabledCameras']
        .map((camera: CameraConfig) => ({ text: camera.name, value: camera.id, disabled: !camera.enabled || camera.service === 'iframe' }))
    ]
  }

  get autoOpenQRDetectionCameraId (): string {
    return this.$store.state.config.uiSettings.spoolman.autoOpenQRDetectionCamera
  }

  set autoOpenQRDetectionCameraId (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.autoOpenQRDetectionCamera',
      value,
      server: true
    })
  }

  handleReset () {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman',
      value: defaultState().uiSettings.spoolman,
      server: true
    })
  }
}
</script>
