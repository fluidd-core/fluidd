<template>
  <v-row
    no-gutters
    class="mb-2"
  >
    <v-col>
      <app-up-down-btn-group
        :values="values"
        color="error"
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
import { Stepper } from '@/store/printer/types'

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

  get accel (): number {
    return this.isStepperZ
      ? this.$store.getters['printer/getPrinterSettings']('printer.max_z_accel')
      : this.$store.state.printer.printer.toolhead.max_accel
  }

  get isStepperZ (): boolean {
    return this.stepper.key.startsWith('stepper_z')
  }

  sendForceMoveGcode (distance: number) {
    this.sendGcode(`FORCE_MOVE STEPPER="${this.stepper.key}" DISTANCE=${distance} VELOCITY=${this.rate} ACCEL=${this.accel}`)
  }
}
</script>
