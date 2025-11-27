<template>
  <div>
    <h3 class="text-h5 mb-3">
      {{ title }}
    </h3>
    <app-setting
      :title="$t('app.afc.SettingsDialog.BowdenLength')"
      :sub-title="$t('app.afc.SettingsDialog.BowdenLengthDescription')"
    >
      <app-number-input
        label="afc_bowden_length"
        param="LENGTH"
        :target="currentLength"
        :default-value="settingsLength"
        :output-error-msg="true"
        :has-spinner="true"
        :spinner-factor="1"
        :step="1"
        :min="0"
        :max="null"
        :dec="0"
        unit="mm"
        class="w-100"
        @submit="setBowdenLength"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component({})
export default class AfcSettingsDialogHub extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  get title () {
    const name = Vue.$filters.prettyCase(`Hub ${this.name}`)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name })
  }

  get afcSettingsHub () {
    const settings = this.$typedState.printer.printer.configfile?.settings ?? {}
    const name = `AFC_hub ${this.name}`.toLowerCase()
    return settings[name] || {}
  }

  get settingsLength () {
    return this.afcSettingsHub.afc_bowden_length || 0
  }

  get printerObject () {
    const printer = this.$typedState.printer.printer ?? {}
    const key = `AFC_hub ${this.name}`

    return printer[key] ?? {}
  }

  get currentLength () {
    return this.printerObject.afc_bowden_length || 0
  }

  setBowdenLength (args: { name: string; value: number }) {
    const gcode = `SET_BOWDEN_LENGTH HUB=${this.name} ${args.name}=${args.value}`
    this.sendGcode(gcode)
  }
}
</script>
