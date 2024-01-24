<template>
  <div>
    <!-- Output Pins -->
    <app-named-slider
      v-if="pwm"
      :label="pin.prettyName"
      :min="0"
      :max="pin.scale"
      :step="0.01"
      :value="(pin.value * pin.scale) / 1"
      :reset-value="pin.config.value || 0"
      :disabled="!klippyReady"
      :locked="isMobileViewport"
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @submit="setValue"
    />

    <app-named-switch
      v-else
      :disabled="!klippyReady"
      :label="pin.prettyName"
      :value="pin.value > 0"
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @input="setValue"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { OutputPin as IOutputPin } from '@/store/printer/types'

@Component({})
export default class OutputPin extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Object, required: true })
  readonly pin!: IOutputPin

  get pwm () {
    return (
      this.pin.pwm ||
      this.pin.type === 'pwm_cycle_time'
    )
  }

  setValue (target: number) {
    if (!this.pwm) {
      target = (target) ? this.pin.scale : 0
    }
    this.sendGcode(`SET_PIN PIN=${this.pin.name} VALUE=${target}`, `${this.$waits.onSetOutputPin}${this.pin.name}`)
  }
}
</script>
