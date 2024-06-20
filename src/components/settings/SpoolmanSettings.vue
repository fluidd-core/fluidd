<template>
  <div>
    <v-subheader id="spoolman">
      {{ $t('app.spoolman.title.spoolman') }}
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
      <app-setting
        :title="$t('app.spoolman.setting.prefer_device_camera')"
      >
        <v-switch
          v-model="preferDeviceCamera"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.spoolman.setting.auto_select_spool_on_match')"
      >
        <v-switch
          v-model="autoSelectSpoolOnMatch"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.spoolman.setting.warn_on_not_enough_filament')"
      >
        <v-switch
          v-model="warnOnNotEnoughFilament"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.spoolman.setting.warn_on_filament_type_mismatch')"
      >
        <v-switch
          v-model="warnOnFilamentTypeMismatch"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$tc('app.spoolman.setting.remaining_filament_unit')"
      >
        <v-select
          v-model="remainingFilamentUnit"
          filled
          dense
          single-line
          hide-details="auto"
          :items="[
            {text: $tc('app.spoolman.label.weight'), value: 'weight'},
            {text: $tc('app.spoolman.label.length'), value: 'length'}
          ]"
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
import type { WebcamConfig } from '@/store/webcams/types'

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

  get enabledWebcams (): WebcamConfig[] {
    return this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[]
  }

  get supportedCameras (): Array<{ text?: string, value: string | null, disabled?: boolean }> {
    return [
      {
        text: this.$tc('app.setting.label.none'),
        value: null
      },
      ...this.enabledWebcams
        .map(camera => ({
          text: camera.name,
          value: camera.uid,
          disabled: camera.service === 'iframe'
        }))
    ]
  }

  get autoOpenQRDetectionCameraId (): string | null {
    return this.$store.state.config.uiSettings.spoolman.autoOpenQRDetectionCamera
  }

  set autoOpenQRDetectionCameraId (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.autoOpenQRDetectionCamera',
      value,
      server: true
    })
  }

  get preferDeviceCamera () {
    return this.$store.state.config.uiSettings.spoolman.preferDeviceCamera
  }

  set preferDeviceCamera (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.preferDeviceCamera',
      value,
      server: true
    })
  }

  get autoSelectSpoolOnMatch () {
    return this.$store.state.config.uiSettings.spoolman.autoSelectSpoolOnMatch
  }

  set autoSelectSpoolOnMatch (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.autoSelectSpoolOnMatch',
      value,
      server: true
    })
  }

  get warnOnNotEnoughFilament () {
    return this.$store.state.config.uiSettings.spoolman.warnOnNotEnoughFilament
  }

  set warnOnNotEnoughFilament (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.warnOnNotEnoughFilament',
      value,
      server: true
    })
  }

  get warnOnFilamentTypeMismatch () {
    return this.$store.state.config.uiSettings.spoolman.warnOnFilamentTypeMismatch
  }

  set warnOnFilamentTypeMismatch (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.warnOnFilamentTypeMismatch',
      value,
      server: true
    })
  }

  get remainingFilamentUnit () {
    return this.$store.state.config.uiSettings.spoolman.remainingFilamentUnit
  }

  set remainingFilamentUnit (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.remainingFilamentUnit',
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
