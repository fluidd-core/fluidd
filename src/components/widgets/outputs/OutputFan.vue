<template>
  <div>
    <app-slider
      v-if="fan.controllable"
      suffix="%"
      input-xs
      :value="value"
      :reset-value="0"
      @change="handleChange"
      :label="(rpm) ? `${fan.prettyName} <small>${rpm}</small>` : fan.prettyName"
      :rules="rules"
      :disabled="!klippyReady"
      :locked="!klippyReady || isMobile"
    >
    </app-slider>

    <v-layout
      v-if="!fan.controllable"
      align-center
      justify-space-between
    >
      <div class="text-body-1">
        {{ fan.prettyName }}
      </div>
      <div class="ml-auto">
        <small v-if="rpm" class="mr-2">{{ rpm }}</small>
        <span class="focus--text" v-html="prettyValue"></span>
      </div>
    </v-layout>

  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { Fan } from '@/store/printer/types'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class OutputFan extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  fan!: Fan

  get prettyValue () {
    return (this.value === 0)
      ? this.$t('app.general.label.off')
      : `${this.value.toFixed()}<small>%</small>`
  }

  get value () {
    return (this.fan.speed) ? Math.round(this.fan.speed * 100) : 0
  }

  handleChange (target: number) {
    // If this is a controllable fan, it's either the part fan [fan] or a generic fan [fan_generic].
    if (this.fan.type === 'fan') {
      target = Math.ceil(target * 2.55)
      this.sendGcode(`M106 S${target}`, Waits.onSetFanSpeed)
    }
    if (this.fan.type === 'fan_generic') {
      target = target / 100
      this.sendGcode(`SET_FAN_SPEED FAN=${this.fan.name} SPEED=${target}`, Waits.onSetFanSpeed)
    }
  }

  get rpm () {
    return (this.fan.rpm)
      ? this.fan.rpm.toFixed() + ' rpm'
      : undefined
  }

  get offBelow () {
    const config = this.$store.getters['printer/getPrinterSettings'](this.fan.name) || {}
    return config.off_below * 100 || 0
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  rules = [
    (v: string) => {
      if (this.offBelow <= 0) return true
      return (parseFloat(v) >= this.offBelow || parseFloat(v) === 0) || this.$t('app.general.simple_form.error.min_or_0', { min: this.offBelow })
    }
  ]
}
</script>
