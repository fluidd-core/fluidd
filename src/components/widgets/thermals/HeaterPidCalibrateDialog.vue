<template>
  <app-dialog
    v-model="open"
    :title="$t('app.chart.title.pid_calibrate', { name: heater.prettyName })"
    max-width="320"
    @save="handleSave"
  >
    <v-card-text>
      <v-text-field
        v-model.number="targetTemperature"
        autofocus
        outlined
        :label="$t('app.chart.label.target_temperature')"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThan(0)
        ]"
        required
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import type { Heater } from '@/store/printer/types'
import { Component, Vue, VModel, Prop } from 'vue-property-decorator'

@Component({})
export default class HeaterPidCalibrateDialog extends Vue {
  targetTemperature = 100

  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly heater!: Heater

  handleSave () {
    this.$emit('save', this.heater, this.targetTemperature)
    this.open = false
  }
}
</script>
