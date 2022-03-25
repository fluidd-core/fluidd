<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
    >
      <app-slider
        :label="$t('app.general.label.pressure_advance')"
        suffix="mm/s"
        :value="activeExtruder.pressure_advance || 0"
        :overridable="true"
        :reset-value="activeExtruder.config_pressure_advance || 0"
        :disabled="!klippyReady || hasWait(waits.onSetPressureAdvance)"
        :locked="(!klippyReady || isMobile)"
        :min="0"
        :max="2"
        :step="0.01"
        @change="handleSetPressureAdvance"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
      <app-slider
        :label="$t('app.general.label.smooth_time')"
        suffix="s"
        :value="activeExtruder.smooth_time || 0"
        :overridable="false"
        :reset-value="activeExtruder.config_smooth_time || 0"
        :disabled="!klippyReady || hasWait(waits.onSetPressureAdvance)"
        :locked="(!klippyReady || isMobile)"
        :min="0"
        :max="0.2"
        :step="0.01"
        @change="handleSetSmoothTime"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { Waits } from '@/globals'

@Component({})
export default class PressureAdvanceAdjust extends Mixins(StateMixin, ToolheadMixin) {
  waits = Waits

  handleSetPressureAdvance (val: number) {
    this.sendGcode('SET_PRESSURE_ADVANCE ADVANCE=' + val, this.waits.onSetPressureAdvance)
  }

  handleSetSmoothTime (val: number) {
    this.sendGcode('SET_PRESSURE_ADVANCE SMOOTH_TIME=' + val, this.waits.onSetPressureAdvance)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
