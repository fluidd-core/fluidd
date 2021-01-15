<template>
  <!-- Output Pins -->
  <v-row no-gutters>
    <v-col class="">
      <div v-for="(pin, i) in pins" :key="i">
        <input-slider
          v-if="pin && pin.pwm"
          input-xs
          :label="pin.prettyName"
          :min="0"
          :max="pin.scale"
          :step="0.01"
          :value="(pin.value * pin.scale) / 1"
          :disabled="!klippyConnected"
          :readonly="!pin.controllable"
          @input="setValue(pin, $event)">
        </input-slider>

        <input-switch
          v-if="pin && !pin.pwm"
          :label="pin.prettyName"
          :value="(pin.value > 0)"
          @input="setValue(pin, $event)"
        >
        </input-switch>

        <v-divider class="my-2" v-if="i < pins.length - 1"></v-divider>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import InputSwitch from '@/components/inputs/InputSwitch.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { OutputPin } from '@/store/socket/types'

@Component({
  components: {
    InputSlider,
    InputSwitch
  }
})
export default class OutputPinsWidget extends Mixins(UtilsMixin) {
  get pins () {
    return this.$store.getters['socket/getPins']
  }

  setValue (pin: OutputPin, target: number) {
    if (!pin.pwm) {
      target = (target) ? pin.scale : 0
    }
    console.log('setValue', target)
    this.sendGcode(`SET_PIN PIN=${pin.name} VALUE=${target}`, Waits.onSetOutputPin)
  }
}
</script>
