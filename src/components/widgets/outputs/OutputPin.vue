<template>
  <div>
    <!-- Output Pins -->
    <app-slider
      v-if="pin && pin.pwm"
      input-xs
      :label="pin.prettyName"
      :min="0"
      :max="pin.scale"
      :step="0.01"
      :value="(pin.value * pin.scale) / 1"
      :reset-value="pin.config.value || 0"
      :disabled="!klippyReady"
      :locked="!klippyReady || isMobile"
      @change="setValue(pin, $event)"
    />

    <app-switch
      v-if="pin && !pin.pwm"
      :disabled="!klippyReady"
      :label="pin.prettyName"
      :value="(pin.value > 0)"
      @input="setValue(pin, $event)"
    />
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
  public pin!: IOutputPin

  setValue (pin: IOutputPin, target: number) {
    if (!pin.pwm) {
      target = (target) ? pin.scale : 0
    }
    this.sendGcode(`SET_PIN PIN=${pin.name} VALUE=${target}`, Waits.onSetOutputPin)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
