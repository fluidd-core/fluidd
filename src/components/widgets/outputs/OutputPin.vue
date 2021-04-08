<template>
  <!-- Output Pins -->
  <div>
    <app-slider
      v-if="pin && pin.pwm"
      input-xs
      :label="pin.prettyName"
      :min="0"
      :max="pin.scale"
      :step="0.01"
      :value="(pin.value * pin.scale) / 1"
      :disabled="!klippyReady"
      :readonly="!pin.controllable"
      @input="setValue(pin, $event)">
    </app-slider>

    <app-switch
      v-if="pin && !pin.pwm"
      :disabled="!klippyReady"
      :label="pin.prettyName"
      :value="(pin.value > 0)"
      @input="setValue(pin, $event)"
    >
    </app-switch>

    <v-divider class="my-2" v-if="divider"></v-divider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'
import { OutputPin as IOutputPin } from '@/store/printer/types'

@Component({})
export default class OutputPin extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  pin!: IOutputPin

  @Prop({ type: Boolean, default: false })
  divider!: boolean

  setValue (pin: IOutputPin, target: number) {
    if (!pin.pwm) {
      target = (target) ? pin.scale : 0
    }
    this.sendGcode(`SET_PIN PIN=${pin.name} VALUE=${target}`, Waits.onSetOutputPin)
  }
}
</script>
