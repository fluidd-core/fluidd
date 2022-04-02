<template>
  <div>
    <v-subheader id="timelapse">
      {{ $t('app.timelapse.title.timelapse') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        :title="$tc('app.general.title.camera', 1)"
        :sub-title="subtitleIfBlocked(cameraBlocked)"
      >
        <v-select
          v-model="camera"
          filled
          dense
          single-line
          hide-details="auto"
          :items="cameras"
          :value="camera"
          :disabled="cameraBlocked"
        />
      </app-setting>
      <v-divider />

      <app-setting
        :title="$t('app.timelapse.setting.mode')"
        :sub-title="subtitleIfBlocked(modeBlocked)"
      >
        <v-select
          v-model="mode"
          filled
          dense
          single-line
          hide-details="auto"
          :items="supportedModes"
          :value="mode"
          :disabled="modeBlocked"
        />
      </app-setting>

      <hyperlapse-settings v-if="mode === 'hyperlapse'" />

      <toolhead-parking-settings />

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
import StateMixin from '@/mixins/state'
import {
  TimelapseMode,
  TimelapseSettings as TimelapseSettingsType
} from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import HyperlapseSettings from '@/components/settings/timelapse/subsettings/modes/HyperlapseSettings.vue'
import { CameraConfig } from '@/store/cameras/types'
import ToolheadParkingSettings from '@/components/settings/timelapse/subsettings/ToolheadParkingSettings.vue'
import { defaultWritableSettings } from '@/store/timelapse'

@Component({
  components: { ToolheadParkingSettings, HyperlapseSettings }
})
export default class TimelapseSettings extends Mixins(StateMixin) {
  get supportedModes (): {text: string, value: TimelapseMode}[] {
    return [{
      text: this.$tc('app.timelapse.setting.mode_layermacro'),
      value: 'layermacro'
    }, {
      text: this.$tc('app.timelapse.setting.mode_hyperlapse'),
      value: 'hyperlapse'
    }]
  }

  get cameras (): {text: string, value: string} {
    return this.$store.getters['cameras/getCameras'].map((camera: CameraConfig) => ({ text: camera.name, value: camera.id }))
  }

  get cameraBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('camera')
  }

  get camera (): string {
    return this.settings?.camera
  }

  set camera (value: string) {
    SocketActions.machineTimelapseSetSettings({ camera: value })
  }

  get modeBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('mode')
  }

  get mode (): TimelapseMode {
    return this.settings?.mode
  }

  set mode (value: TimelapseMode) {
    SocketActions.machineTimelapseSetSettings({ mode: value })
  }

  get settings (): TimelapseSettingsType {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.timelapse.tooltip.managed_by_moonraker') : ''
  }

  handleReset () {
    const nonBlockedEntries = Object.entries(defaultWritableSettings)
      .filter(([key]) => !this.$store.getters['timelapse/isBlockedSetting'](key))
    SocketActions.machineTimelapseSetSettings(Object.fromEntries(nonBlockedEntries))
  }
}
</script>
