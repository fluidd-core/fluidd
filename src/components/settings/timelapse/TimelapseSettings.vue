<template>
  <div>
    <v-subheader id="timelapse">
      {{ $t('app.general.title.timelapse') }}
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
          :disabled="modeBlocked"
        />
      </app-setting>

      <hyperlapse-settings v-if="mode === 'hyperlapse'" />

      <toolhead-parking-settings />

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.stream_delay_compensation')"
        :sub-title="subtitleIfBlocked(delayCompBlocked)"
      >
        <v-text-field
          ref="delayCompElement"
          :value="delayComp"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0)
          ]"
          :disabled="delayCompBlocked"
          hide-details="auto"
          filled
          dense
          single-line
          suffix="ms"
          @change="setDelayComp"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.gcode_verbose')"
        :sub-title="subtitleIfBlocked(verboseGcodeBlocked)"
      >
        <v-switch
          v-model="verboseGcode"
          hide-details
          :disabled="verboseGcodeBlocked"
          @click.native.stop
        />
      </app-setting>

      <v-divider />
      <app-setting :title="$tc('app.timelapse.title.render_settings')">
        <app-btn
          outlined
          small
          color="primary"
          @click="renderSettingsDialogOpen = true"
        >
          <v-icon
            small
            left
          >
            $pencil
          </v-icon>
          {{ $t('app.general.btn.edit') }}
        </app-btn>
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

    <timelapse-render-settings-dialog
      v-if="renderSettingsDialogOpen"
      v-model="renderSettingsDialogOpen"
      :renderable="false"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { TimelapseMode, TimelapseSettings as TimelapseSettingsType } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import HyperlapseSettings from '@/components/settings/timelapse/subsettings/modes/HyperlapseSettings.vue'
import type { WebcamConfig } from '@/store/webcams/types'
import ToolheadParkingSettings from '@/components/settings/timelapse/subsettings/ToolheadParkingSettings.vue'
import { defaultWritableSettings } from '@/store/timelapse/state'
import TimelapseRenderSettingsDialog from '@/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue'
import type { VInput } from '@/types'

@Component({
  components: {
    ToolheadParkingSettings,
    HyperlapseSettings,
    TimelapseRenderSettingsDialog
  }
})
export default class TimelapseSettings extends Mixins(StateMixin) {
  @Ref('delayCompElement')
  readonly delayCompElement!: VInput

  renderSettingsDialogOpen = false

  get supportedModes (): { text: string, value: TimelapseMode }[] {
    return [{
      text: this.$tc('app.timelapse.setting.mode_layermacro'),
      value: 'layermacro'
    }, {
      text: this.$tc('app.timelapse.setting.mode_hyperlapse'),
      value: 'hyperlapse'
    }]
  }

  get cameras (): Array<{ text?: string, value: string, disabled: boolean }> {
    const cameras = this.$store.getters['webcams/getWebcams'] as WebcamConfig[]

    return cameras
      .map(camera => ({
        text: camera.name,
        value: camera.uid,
        disabled: !camera.enabled
      }))
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

  get delayCompBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('stream_delay_compensation')
  }

  get delayComp (): number {
    return this.settings?.stream_delay_compensation * 1000
  }

  setDelayComp (value: number) {
    if (this.delayCompElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ stream_delay_compensation: value / 1000 })
    }
  }

  get verboseGcodeBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('gcode_verbose')
  }

  get verboseGcode (): boolean {
    return this.settings?.gcode_verbose
  }

  set verboseGcode (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ gcode_verbose: value })
  }

  get settings (): TimelapseSettingsType {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }

  handleReset () {
    const nonBlockedEntries = Object.entries(defaultWritableSettings())
      .filter(([key]) => !this.$store.getters['timelapse/isBlockedSetting'](key))
    SocketActions.machineTimelapseSetSettings(Object.fromEntries(nonBlockedEntries))
  }
}
</script>
