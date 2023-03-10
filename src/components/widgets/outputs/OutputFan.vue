<template>
  <div>
    <app-named-slider
      v-if="fan.controllable"
      suffix="%"
      :value="value"
      :reset-value="0"
      :label="(rpm) ? `${fan.prettyName} <small>${rpm}</small>` : fan.prettyName"
      :rules="[
        customRules.minFan
      ]"
      :disabled="!klippyReady"
      :locked="isMobileViewport"
      :loading="hasWait(`${$waits.onSetFanSpeed}${fan.name}`)"
      @submit="handleChange"
    />

    <v-layout
      v-else
      align-center
      justify-space-between
      :class="{ 'text--disabled': !klippyReady }"
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
          class="focus--text"
          v-html="prettyValue"
        />
      </div>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { Fan } from '@/store/printer/types'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class OutputFan extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Object, required: true })
  readonly fan!: Fan

  get prettyValue () {
    return (this.value === 0)
      ? this.$t('app.general.label.off')
      : this.$t('app.general.label.on')
  }

  get value () {
    if (!this.fan.speed) return 0
    const speed = this.fan.speed / +(this.fan.config.max_power || 1)
    return Math.round(speed * 100)
  }

  handleChange (target: number) {
    // If this is a controllable fan, it's either the part fan [fan] or a generic fan [fan_generic].
    if (this.fan.type === 'fan') {
      target = Math.ceil(target * 2.55)
      this.sendGcode(`M106 S${target}`, `${this.$waits.onSetFanSpeed}${this.fan.name}`)
    }
    if (this.fan.type === 'fan_generic') {
      target = target / 100
      this.sendGcode(`SET_FAN_SPEED FAN=${this.fan.name} SPEED=${target}`, `${this.$waits.onSetFanSpeed}${this.fan.name}`)
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
        const off_below = +(this.fan.config?.off_below || 0) * 100

        if (!off_below) return true

        v = +v

        return (v >= off_below || v === 0) || this.$t('app.general.simple_form.error.min_or_0', { min: off_below })
      }
    }
  }
}
</script>
