<template>
  <!-- Output Pins -->
  <div>
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

    <v-divider class="my-2" v-if="divider"></v-divider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
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
export default class OutputPinWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Object, required: true })
  pin!: OutputPin

  @Prop({ type: Boolean, default: false })
  divider!: boolean

  setValue (pin: OutputPin, target: number) {
    if (!pin.pwm) {
      target = (target) ? pin.scale : 0
    }
    console.log('setValue', target)
    this.sendGcode(`SET_PIN PIN=${pin.name} VALUE=${target}`, Waits.onSetOutputPin)
  }
}
</script>
