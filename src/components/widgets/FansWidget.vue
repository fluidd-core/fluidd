<template>
  <!-- Fans -->
  <v-row no-gutters class="mb-4">
    <v-col class="">
      <div v-for="(fan, i) in fans" :key="i">
        <input-slider
          :label="fan.prettyName"
          value-suffix="%"
          :value="fan.speed * 100"
          :rules="rules"
          :disabled="!klippyConnected"
          :readonly="!fan.controllable"
          @input="setFanSpeed(fan, $event)">
        </input-slider>
        <v-divider class="my-2" v-if="i < fans.length - 1"></v-divider>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { Fan } from '@/store/socket/types'

@Component({
  components: {
    InputSlider
  }
})
export default class FansWidget extends Mixins(UtilsMixin) {
  get fans () {
    return this.$store.getters['socket/getFans']()
  }

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

  setFanSpeed (fan: Fan, target: number) {
    // If this is a controllable fan, it's either the part fan [fan] or a generic fan [fan_generic].
    if (fan.type === 'fan') {
      target = Math.ceil(target * 2.55)
      this.sendGcode(`M106 S${target}`, Waits.onSetFanSpeed)
    }
    if (fan.type === 'fan_generic') {
      target = target / 100
      this.sendGcode(`SET_FAN_SPEED FAN=${fan.name} SPEED=${target}`, Waits.onSetFanSpeed)
    }
  }
}
</script>

<style type="scss" scoped>

</style>
