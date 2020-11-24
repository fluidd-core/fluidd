<template>
  <!-- Fans -->
  <v-row no-gutters class="mb-4">
    <v-col class="">
      <input-slider
        label="Part Fan"
        value-suffix="%"
        :value="partFanSpeed"
        :rules="rules"
        :disabled="!klippyConnected"
        @input="setPartFanSpeed($event)">
      </input-slider>
    </v-col>
  </v-row>
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
export default class FansWidget extends Mixins(UtilsMixin) {
  get partFanSpeed () {
    return this.$store.state.socket.printer.fan.speed * 100
  }

  get offBelow () {
    const offBelow = parseFloat(this.$store.state.socket.printer.configfile.config.fan.off_below) || 0
    return offBelow * 100
  }

  rules = [
    (v: number) => {
      if (this.offBelow <= 0) return true
      return (v >= this.offBelow || v === 0) || 'min error'
    }
  ]

  setPartFanSpeed (target: number) {
    target = Math.ceil(target * 2.55)
    this.sendGcode(`M106 S${target}`, Waits.onSetFanSpeed)
  }
}
</script>

<style type="scss" scoped>

</style>
