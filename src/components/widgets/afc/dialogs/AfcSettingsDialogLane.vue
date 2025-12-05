<template>
  <v-card outlined>
    <v-card-title>{{ title }}</v-card-title>

    <v-card-text>
      <app-setting
        :title="$t('app.afc.SettingsDialog.DistHub')"
        :sub-title="$t('app.afc.SettingsDialog.DistHubDescription')"
      >
        <app-named-slider
          label="dist_hub"
          :value="currentDistHub"
          :reset-value="settingsDistHub"
          :min="0"
          :max="100"
          :step="1"
          overridable
          suffix="mm"
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
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class AfcSettingsDialogLane extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  changedValue = false

  get title () {
    const name = Vue.$filters.prettyCase(this.name)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name })
  }

  get afcSettingsLane () {
    return this.getAfcLaneSettings(this.name)
  }

  get afcLane () {
    return this.getAfcLaneObject(this.name)
  }

  get settingsDistHub () {
    return this.afcSettingsLane.dist_hub || 0
  }

  get currentDistHub () {
    return this.afcLane.dist_hub || 0
  }

  get enableSaveButton () {
    if (!this.changedValue) return false

    return this.currentDistHub !== this.settingsDistHub
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
