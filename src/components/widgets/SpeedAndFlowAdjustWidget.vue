<template>
  <div>
    <!-- Speed and Flow Adjust -->
    <input-slider
      label="Speed"
      value-suffix="%"
      :value="speed"
      :disabled="!klippyConnected"
      :loading="hasWait(waits.onSetSpeed)"
      :min="0"
      :max="200"
      @input="setSpeed($event, waits.onSetSpeed)">
    </input-slider>

    <v-divider class="my-2"></v-divider>

    <input-slider
      label="Flow"
      value-suffix="%"
      :value="flow"
      :disabled="!klippyConnected"
      :loading="hasWait(waits.onSetFlow)"
      :min="0"
      :max="200"
      @input="setFlow($event, waits.onSetFlow)">
    </input-slider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({
  components: {
    InputSlider
  }
})
export default class SpeedAndFlowAdjustWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get flow () {
    return this.$store.state.socket.printer.gcode_move.extrude_factor * 100
  }

  get speed () {
    return this.$store.state.socket.printer.gcode_move.speed_factor * 100
  }

  setSpeed (speed: number, wait?: string) {
    this.sendGcode('M220 S' + speed, wait)
  }

  setFlow (flow: number, wait?: string) {
    this.sendGcode('M221 S' + flow, wait)
  }
}
</script>

<style type="scss" scoped>
</style>
