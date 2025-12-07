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
        submit-on-change
        @submit="setBowdenLength"
      />
    </app-setting>
    <v-card-text />
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { KlipperPrinterAfcHubSettings } from '@/store/printer/types'

@Component({})
export default class AfcSettingsDialogHub extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get title (): string {
    const name = this.$filters.prettyCase(`Hub ${this.name}`)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name }).toString()
  }

  get afcSettingsHub (): KlipperPrinterAfcHubSettings | undefined {
    return this.getAfcHubSettings(this.name)
  }

  get settingsLength (): number {
    return this.afcSettingsHub?.afc_bowden_length || 0
  }

  get printerObject () {
    return this.$typedState.printer.printer[(`AFC_hub ${this.name}`)]
  }

  get currentLength (): number {
    return this.printerObject?.afc_bowden_length || 0
  }

  setBowdenLength (value: number) {
    this.sendGcode(`SET_BOWDEN_LENGTH HUB=${encodeGcodeParamValue(this.name)} LENGTH=${value}`)
  }
}
</script>
