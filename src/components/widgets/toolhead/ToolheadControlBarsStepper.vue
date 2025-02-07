<template>
  <v-row
    no-gutters
    class="mb-2"
  >
    <v-col>
      <app-up-down-btn-group
        :values="values"
        color="error"
        class="d-flex"
        @click="sendForceMoveGcode($event)"
      >
        <div class="v-btn v-size--default btncolor flex-grow-1">
          {{ stepper.prettyName }}
        </div>
      </app-up-down-btn-group>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { KlipperPrinterSettings, Stepper } from '@/store/printer/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class ToolheadControlBarsStepper extends Mixins(StateMixin) {
  @Prop({ type: Object })
  readonly stepper!: Stepper

  get values (): number[] {
    return [1, 10, 50]
  }

  get rate (): number {
    return this.isStepperZ
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  }

  get printerSettings (): KlipperPrinterSettings {
    return this.$store.getters['printer/getPrinterSettings']
  }

  get accel (): number {
    return this.isStepperZ
      ? this.printerSettings.printer?.max_z_accel ?? 100
      : this.$store.state.printer.printer.toolhead.max_accel
  }

  get isStepperZ (): boolean {
    return this.stepper.key.startsWith('stepper_z')
  }

  sendForceMoveGcode (distance: number) {
    this.sendGcode(`FORCE_MOVE STEPPER=${encodeGcodeParamValue(this.stepper.key)} DISTANCE=${distance} VELOCITY=${this.rate} ACCEL=${this.accel}`)
  }
}
</script>
