<template>
  <div>
    <h3 class="text-h5 mb-3 mt-5">
      {{ title }}
    </h3>
    <app-setting
      :title="$t('app.afc.SettingsDialog.DistHub')"
      :sub-title="$t('app.afc.SettingsDialog.DistHubDescription')"
    >
      <app-number-input
        label="dist_hub"
        param="LENGTH"
        :target="currentDistHub"
        :default-value="settingsDistHub"
        :output-error-msg="true"
        :has-spinner="true"
        :spinner-factor="1"
        :step="1"
        :min="0"
        :max="null"
        :dec="0"
        unit="mm"
        class="w-100"
        @submit="setHubDist"
      />
    </app-setting>
    <v-divider class="my-3" />
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

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

  setHubDist (args: { name: string; value: number }) {
    this.changedValue = true
    this.sendGcode(`SET_HUB_DIST LANE=${this.name} ${args.name}=${args.value}`)
  }

  saveHubDist () {
    this.changedValue = false
    const gcode = `SAVE_HUB_DIST LANE=${this.name}`
    this.sendGcode(gcode)
  }

  doSend (gcode: string) {
    this.sendGcode(gcode)
  }
}
</script>
