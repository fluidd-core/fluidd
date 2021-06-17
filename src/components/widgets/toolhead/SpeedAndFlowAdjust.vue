<template>
  <v-row>
    <v-col cols="12" sm="6">
      <app-slider
        :label="$t('app.general.label.speed')"
        suffix="%"
        :value="speed"
        @change="handleSetSpeed"
        :reset-value="100"
        :disabled="!klippyReady || hasWait(waits.onSetSpeed)"
        :locked="(!klippyReady || isMobile)"
        :min="1"
        :max="200">
      </app-slider>
    </v-col>
    <v-col cols="12" sm="6">
      <app-slider
        :label="$t('app.general.label.flow')"
        suffix="%"
        :value="flow"
        @change="handleSetFlow"
        :reset-value="100"
        :disabled="!klippyReady || hasWait(waits.onSetFlow)"
        :locked="(!klippyReady || isMobile)"
        :min="1"
        :max="200">
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

  get flow () {
    return Math.round(this.$store.state.printer.printer.gcode_move.extrude_factor * 100) || 100
  }

  handleSetFlow (val: number) {
    this.sendGcode('M221 S' + val, this.waits.onSetFlow)
  }

  get speed () {
    return Math.round(this.$store.state.printer.printer.gcode_move.speed_factor * 100) || 100
  }

  handleSetSpeed (val: number) {
    this.sendGcode('M220 S' + val, this.waits.onSetSpeed)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
