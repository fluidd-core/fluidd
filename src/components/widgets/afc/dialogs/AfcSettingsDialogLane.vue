<template>
  <v-card outlined>
    <v-card-title>{{ title }}</v-card-title>

    <v-card-text>
      <app-setting
        :title="$t('app.afc.SettingsDialog.DistHub')"
        :sub-title="$t('app.afc.SettingsDialog.DistHubDescription')"
      >
        <app-named-text-field
          label="dist_hub"
          :value="currentDistHub"
          :reset-value="settingsDistHub"
          suffix="mm"
          submit-on-change
          @submit="setHubDist"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.afc.SettingsDialog.SaveHubDist')"
        :sub-title="$t('app.afc.SettingsDialog.SaveHubDistDescription')"
      >
        <v-btn
          :disabled="!enableSaveButton"
          color="primary"
          @click="saveHubDist"
        >
          {{ $t('app.afc.SettingsDialog.WriteToFile') }}
        </v-btn>
      </app-setting>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { KlipperPrinterAfcLaneSettings, KlipperPrinterAfcStepperSettings } from '@/store/printer/types'

@Component({})
export default class AfcSettingsDialogLane extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  changedValue = false

  get title () {
    const name = this.$filters.prettyCase(this.name)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name })
  }

  get afcSettingsLane (): KlipperPrinterAfcLaneSettings | KlipperPrinterAfcStepperSettings | undefined {
    return this.getAfcLaneSettings(this.name)
  }

  get afcLane () {
    return this.getAfcLaneObject(this.name)
  }

  get settingsDistHub (): number {
    return (
      this.afcSettingsLane != null &&
      'dist_hub' in this.afcSettingsLane &&
      this.afcSettingsLane.dist_hub
    ) || 0
  }

  get currentDistHub (): number {
    return (
      this.afcLane != null &&
      'dist_hub' in this.afcLane &&
      this.afcLane.dist_hub
    ) || 0
  }

  get enableSaveButton (): boolean {
    return (
      this.changedValue &&
      this.currentDistHub !== this.settingsDistHub
    )
  }

  setHubDist (value: number) {
    this.changedValue = true
    this.sendGcode(`SET_HUB_DIST LANE=${encodeGcodeParamValue(this.name)} LENGTH=${value}`)
  }

  saveHubDist () {
    this.changedValue = false
    this.sendGcode(`SAVE_HUB_DIST LANE=${encodeGcodeParamValue(this.name)}`)
  }
}
</script>
