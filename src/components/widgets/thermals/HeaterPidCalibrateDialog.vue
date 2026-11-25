<template>
  <app-dialog
    v-model="open"
    :title="$t('app.chart.title.pid_calibrate', { name: heater.prettyName })"
    max-width="480"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.chart.label.target_temperature')">
        <app-text-field
          v-model.number="targetTemperature"
          type="number"
          autofocus
          dense
          filled
          hide-details="auto"
          :rules="[$rules.required, $rules.numberValid, $rules.numberGreaterThan(0)]"
          suffix="°C"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel, Prop } from 'vue-property-decorator'
import type { Heater } from '@/store/printer/types'

@Component({})
export default class HeaterPidCalibrateDialog extends Vue {
  targetTemperature = 100

  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly heater!: Heater

  handleSave() {
    this.$emit('save', this.heater, this.targetTemperature)
    this.open = false
  }
}
</script>
