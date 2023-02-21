<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
    >
      <app-named-slider
        :label="$t('app.general.label.speed')"
        suffix="%"
        :value="speed"
        overridable
        :reset-value="100"
        :disabled="!klippyReady"
        :loading="hasWait($waits.onSetSpeed)"
        :locked="isMobileViewport"
        :min="1"
        :max="200"
        @submit="handleSetSpeed"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
      <app-named-slider
        :label="$t('app.general.label.flow')"
        suffix="%"
        :value="flow"
        overridable
        :reset-value="100"
        :disabled="!klippyReady"
        :loading="hasWait($waits.onSetFlow)"
        :locked="isMobileViewport"
        :min="1"
        :max="200"
        @submit="handleSetFlow"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class SpeedAndFlowAdjust extends Mixins(StateMixin, BrowserMixin) {
  get flow () {
    return Math.round(this.$store.state.printer.printer.gcode_move.extrude_factor * 100) || 100
  }

  handleSetFlow (val: number) {
    this.sendGcode(`M221 S${val}`, this.$waits.onSetFlow)
  }

  get speed () {
    return Math.round(this.$store.state.printer.printer.gcode_move.speed_factor * 100) || 100
  }

  handleSetSpeed (val: number) {
    this.sendGcode(`M220 S${val}`, this.$waits.onSetSpeed)
  }
}
</script>
