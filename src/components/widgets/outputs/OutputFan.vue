<template>
  <div>
    <app-named-slider
      v-if="fan.controllable"
      suffix="%"
      :value="value"
      :reset-value="0"
      :label="label"
      :rules="[
        customRules.minFan
      ]"
      :disabled="!klippyReady || fan.disconnected"
      :locked="isMobileUserAgent"
      :loading="hasWait(`${$waits.onSetFanSpeed}${fan.name}`)"
      @submit="handleChange"
    />

    <v-layout
      v-else
      align-center
      justify-space-between
      :class="{ 'text--disabled': !klippyReady || fan.disconnected }"
    >
      <div class="text-body-1">
        {{ fan.prettyName }}
      </div>
      <div class="ml-auto">
        <small
          v-if="rpm"
          class="mr-2"
        >{{ rpm }}</small>
        <span
          v-safe-html="prettyValue"
          class="focus--text"
        />
      </div>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import type { Fan } from '@/store/printer/types'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import buildOutputLabel from '@/util/build-output-label'
import { buildFanSpeedGcode } from '@/util/output-gcode'

@Component({})
export default class OutputFan extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Object, required: true })
  readonly fan!: Fan

  // prettyName may be a user-supplied alias; the label is rendered as HTML
  // (v-safe-html) so escape it before composing the optional <small> rpm markup.
  get label () {
    return buildOutputLabel(this.fan.prettyName, this.rpm)
  }

  get prettyValue () {
    return (this.value === 0)
      ? this.$t('app.general.label.off')
      : `${this.value} %`
  }

  get value () {
    if (!this.fan.speed) return 0
    const speed = this.fan.speed / (this.fan.config?.max_power || 1)
    return Math.round(speed * 100)
  }

  handleChange (target: number) {
    // Display-only: the command is keyed by the raw Klipper name, never the alias.
    const gcode = buildFanSpeedGcode(this.fan, target)

    if (gcode) {
      this.sendGcode(gcode, `${this.$waits.onSetFanSpeed}${this.fan.name}`)
    }
  }

  get rpm () {
    return (this.fan.rpm)
      ? this.fan.rpm.toFixed() + ' rpm'
      : undefined
  }

  get customRules () {
    return {
      minFan: (v: string | number) => {
        const off_below = (this.fan.config?.off_below || 0) * 100

        if (!off_below) return true

        v = +v

        return (v >= off_below || v === 0) || this.$t('app.general.simple_form.error.min_or_0', { min: off_below })
      }
    }
  }
}
</script>
