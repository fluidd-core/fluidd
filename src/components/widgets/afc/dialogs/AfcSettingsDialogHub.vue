<template>
  <v-card outlined>
    <v-card-title>{{ $t('app.afc.SettingsDialog.SettingsForTitle', { name: `Hub ${$filters.prettyCase(name)}` }) }}</v-card-title>
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

@Component({})
export default class AfcSettingsDialogHub extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get afcSettingsHub (): Klipper.AfcHubSettings | undefined {
    return this.getAfcHubSettings(this.name)
  }

  get settingsLength (): number {
    return this.afcSettingsHub?.afc_bowden_length || 0
  }

  get hubObject (): Klipper.AfcHubState | undefined {
    return this.$typedState.printer.printer[`AFC_hub ${this.name}`]
  }

  get currentLength (): number {
    return this.hubObject?.afc_bowden_length || 0
  }

  setBowdenLength (value: number) {
    this.sendGcode(`SET_BOWDEN_LENGTH HUB=${encodeGcodeParamValue(this.name)} LENGTH=${value}`)
  }
}
</script>
