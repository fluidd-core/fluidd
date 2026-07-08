<template>
  <div>
    <app-named-slider
      v-if="pwm"
      suffix="%"
      :label="label"
      :min="0"
      :max="100"
      :value="value"
      :reset-value="resetValue"
      :disabled="!klippyReady || pin.disconnected"
      :locked="isMobileUserAgent"
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @submit="handleChange"
    />

    <app-named-switch
      v-else
      :disabled="!klippyReady || pin.disconnected"
      :label="label"
      :value="pin.value > 0"
      :loading="hasWait(`${$waits.onSetOutputPin}${pin.name}`)"
      @input="handleChange"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { OutputPin as IOutputPin } from '@/store/printer/types'
import buildOutputLabel from '@/util/build-output-label'
import { buildSetPinGcode } from '@/util/output-gcode'

@Component({})
export default class OutputPin extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Object, required: true })
  readonly pin!: IOutputPin

  // prettyName may be a user-supplied alias rendered as HTML (v-safe-html label).
  get label () {
    return buildOutputLabel(this.pin.prettyName)
  }

  get pwm () {
    return (
      this.pin.pwm ||
      this.pwmTypes.includes(this.pin.type)
    )
  }

  get pwmTypes () {
    return [
      'pwm_cycle_time',
      'pwm_tool'
    ]
  }

  get value () {
    return Math.round(this.pin.value * 100)
  }

  get resetValue () {
    return Math.round(this.pin.resetValue / this.pin.scale * 100)
  }

  handleChange (target: number | boolean) {
    if (typeof target === 'boolean') {
      target = target
        ? this.pin.scale
        : 0
    } else {
      target = Math.round(target * this.pin.scale) / 100
    }

    // Display-only: the command is keyed by the raw Klipper name, never the alias.
    this.sendGcode(buildSetPinGcode(this.pin.name, target), `${this.$waits.onSetOutputPin}${this.pin.name}`)
  }
}
</script>
