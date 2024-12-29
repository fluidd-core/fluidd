<template>
  <app-dialog
    v-model="open"
    :title="$t('app.chart.title.mpc_calibrate', { name: heater.prettyName })"
    max-width="480"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.chart.label.target_temperature')">
        <v-text-field
          v-model.number="targetTemperature"
          type="number"
          filled
          dense
          single-line
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThan(0)
          ]"
          suffix="°C"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.chart.label.fan_breakpoints')">
        <v-text-field
          v-model.number="fanBreakpoints"
          type="number"
          filled
          dense
          single-line
          hide-details="auto"
          :rules="[
            $rules.numberValid,
            $rules.numberGreaterThan(0)
          ]"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { Heater } from '@/store/printer/types'
import type { NullableOrEmpty } from '@/util/is-null-or-empty'
import { Component, Vue, VModel, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class HeaterMpcCalibrateDialog extends Vue {
  targetTemperature = 100
  fanBreakpoints: NullableOrEmpty<number> = null

  @Watch('fanBreakpoints')
  onfanBreakpoints (value: string) {
    console.log({ value })
  }

  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly heater!: Heater

  handleSave () {
    this.$emit('save', this.heater, this.targetTemperature, this.fanBreakpoints)
    this.open = false
  }
}
</script>
