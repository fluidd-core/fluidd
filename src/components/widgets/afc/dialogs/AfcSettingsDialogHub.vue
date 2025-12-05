<template>
  <v-card outlined>
    <v-card-title>{{ title }}</v-card-title>
    <app-setting
      :title="$t('app.afc.SettingsDialog.BowdenLength')"
      :sub-title="$t('app.afc.SettingsDialog.BowdenLengthDescription')"
    >
      <app-named-text-field
        label="afc_bowden_length"
        :value="currentLength"
        :reset-value="settingsLength"
        type="number"
        suffix="mm"
        @change="setBowdenLength"
      />
    </app-setting>
    <v-card-text />
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class AfcSettingsDialogHub extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  get title () {
    const name = Vue.$filters.prettyCase(`Hub ${this.name}`)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name })
  }

  get afcSettingsHub () {
    const settings = this.$typedState.printer.printer.configfile?.settings ?? {}
    const name = `afc_hub ${this.name.toLowerCase()}` as const
    return settings[name] || {}
  }

  get settingsLength () {
    return this.afcSettingsHub.afc_bowden_length || 0
  }

  get printerObject () {
    const printer = this.$typedState.printer.printer ?? {}
    const key = `AFC_hub ${this.name}` as const

    return printer[key] ?? {}
  }

  get currentLength () {
    return this.printerObject.afc_bowden_length || 0
  }

  setBowdenLength (value: number) {
    this.sendGcode(`SET_BOWDEN_LENGTH HUB=${encodeGcodeParamValue(this.name)} LENGTH=${value}`)
  }
}
</script>
