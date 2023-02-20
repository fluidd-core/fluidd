<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
    >
      <app-named-slider
        :label="$t('app.general.label.pressure_advance')"
        suffix="s"
        :value="selectedExtruderStepper.pressure_advance || 0"
        overridable
        :reset-value="selectedExtruderStepper.config_pressure_advance || 0"
        :disabled="!klippyReady"
        :locked="isMobile"
        :loading="hasWait(`${$waits.onSetPressureAdvance}${selectedExtruderStepper.name ?? ''}`)"
        :min="0"
        :max="2"
        :step="0.0001"
        @submit="handleSetPressureAdvance"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
      <app-named-slider
        :label="$t('app.general.label.smooth_time')"
        suffix="s"
        :value="selectedExtruderStepper.smooth_time || 0"
        :reset-value="selectedExtruderStepper.config_smooth_time || 0"
        :disabled="!klippyReady"
        :locked="isMobile"
        :loading="hasWait(`${$waits.onSetPressureAdvance}${selectedExtruderStepper.name ?? ''}`)"
        :min="0"
        :max="0.2"
        :step="0.001"
        @submit="handleSetSmoothTime"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { ExtruderStepper } from '@/store/printer/types'

@Component({})
export default class PressureAdvanceAdjust extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Object, required: false })
  readonly extruderStepper?: ExtruderStepper

  get selectedExtruderStepper (): ExtruderStepper {
    return this.extruderStepper ?? this.activeExtruder
  }

  handleSetPressureAdvance (val: number) {
    this.sendSetPressureAdvance('ADVANCE', val)
  }

  handleSetSmoothTime (val: number) {
    this.sendSetPressureAdvance('SMOOTH_TIME', val)
  }

  sendSetPressureAdvance (arg: string, val: number) {
    if (this.extruderStepper) {
      const { name } = this.extruderStepper
      this.sendGcode(`SET_PRESSURE_ADVANCE ${arg}=${val} EXTRUDER=${name}`, `${this.$waits.onSetPressureAdvance}${name}`)
    } else {
      this.sendGcode(`SET_PRESSURE_ADVANCE ${arg}=${val}`, this.$waits.onSetPressureAdvance)
    }
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
