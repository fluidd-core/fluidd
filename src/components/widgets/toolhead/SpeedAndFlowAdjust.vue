<template>
  <v-row>
    <v-col cols="12" sm="6">
      <!-- Speed and Flow Adjust -->
      <app-slider
        :label="$t('app.general.label.speed')"
        value-suffix="%"
        input-xs
        v-model.number="speed"
        :disabled="!klippyReady || hasWait(waits.onSetSpeed)"
        :locked="(!klippyReady || isMobile)"
        :min="1"
        :max="200"
        :rules="rules">
      </app-slider>
    </v-col>
    <v-col cols="12" sm="6">
      <app-slider
        :label="$t('app.general.label.flow')"
        value-suffix="%"
        input-xs
        v-model.number="flow"
        :disabled="!klippyReady || hasWait(waits.onSetFlow)"
        :locked="(!klippyReady || isMobile)"
        :min="1"
        :max="200"
        :rules="rules">
      </app-slider>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class SpeedAndFlowAdjust extends Mixins(StateMixin) {
  waits = Waits

  rules = [
    (v: number) => (v >= 1) || this.$t('app.general.simple_form.error.min', { min: 1 }),
    (v: number) => (v <= 200) || this.$t('app.general.simple_form.error.max', { max: 200 })
  ]

  get flow () {
    return Math.round(this.$store.state.printer.printer.gcode_move.extrude_factor * 100) || 100
  }

  set flow (val: number) {
    this.sendGcode('M221 S' + val, this.waits.onSetFlow)
  }

  get speed () {
    return Math.round(this.$store.state.printer.printer.gcode_move.speed_factor * 100) || 100
  }

  set speed (val: number) {
    this.sendGcode('M220 S' + val, this.waits.onSetSpeed)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
