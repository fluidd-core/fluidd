<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
    >
      <app-slider
        v-model="pressureAdvance"
        :label="$t('app.general.label.pressure_advance')"
        suffix="s"
        :overridable="true"
        :reset-value="activeExtruder.config_pressure_advance || 0"
        :disabled="!klippyReady"
        :locked="(!klippyReady || isMobile)"
        :loading="hasWait($waits.onSetPressureAdvance)"
        :min="0"
        :max="2"
        :step="0.0001"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
      <app-slider
        v-model="smoothTime"
        :label="$t('app.general.label.smooth_time')"
        suffix="s"
        :overridable="false"
        :reset-value="activeExtruder.config_smooth_time || 0"
        :disabled="!klippyReady"
        :locked="(!klippyReady || isMobile)"
        :loading="hasWait($waits.onSetPressureAdvance)"
        :min="0"
        :max="0.2"
        :step="0.001"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class PressureAdvanceAdjust extends Mixins(StateMixin, ToolheadMixin) {
  get pressureAdvance () {
    return this.activeExtruder.pressure_advance || 0
  }

  set pressureAdvance (val: number) {
    this.sendGcode('SET_PRESSURE_ADVANCE ADVANCE=' + val, this.$waits.onSetPressureAdvance)
  }

  get smoothTime () {
    return this.activeExtruder.smooth_time || 0
  }

  set smoothTime (val: number) {
    this.sendGcode('SET_PRESSURE_ADVANCE SMOOTH_TIME=' + val, this.$waits.onSetPressureAdvance)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
