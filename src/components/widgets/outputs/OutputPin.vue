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
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @change="setValue"
    />

    <app-switch
      v-if="pin && !pin.pwm"
      :disabled="!klippyReady"
      :label="pin.prettyName"
      :value="(pin.value > 0)"
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @input="setValue"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { OutputPin as IOutputPin } from '@/store/printer/types'

@Component({})
export default class OutputPin extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  readonly pin!: IOutputPin

  setValue (target: number) {
    if (!this.pin.pwm) {
      target = (target) ? this.pin.scale : 0
    }
    this.sendGcode(`SET_PIN PIN=${this.pin.name} VALUE=${target}`, `${this.$waits.onSetOutputPin}${this.pin.name}`)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
