<template>
  <div>
    <input-slider
      v-if="fan.controllable"
      value-suffix="%"
      input-xs
      v-model.number="value"
      :value-label="rpm"
      :label="$t('printer.outputs.fans.'+fan.name)"
      :rules="rules"
      :disabled="!klippyReady">
    </input-slider>

    <v-layout
      v-if="!fan.controllable"
      align-center
      justify-space-between
    >
      <div class="grey--text text--darken-1 text-body-1">
        {{ $t('printer.outputs.fans.'+fan.name) }}
      </div>
      <div class="ml-auto">
        <small v-if="rpm" class="grey--text mr-2">{{ rpm }}</small>
        <span class="grey--text focus--text" v-html="prettyValue"></span>
      </div>
    </v-layout>
    <v-divider class="my-2" v-if="divider"></v-divider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'
import { Fan } from '@/store/printer/types'

@Component({
  components: {
    InputSlider
  }
})
export default class FanWidget extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  fan!: Fan

  @Prop({ type: Boolean, default: false })
  divider!: boolean

  get prettyValue () {
    return (this.value === 0)
      ? this.$t('app.btn.off')
      : `${this.value.toFixed()}<small>%</small>`
  }

  get value () {
    return (this.fan.speed) ? Math.round(this.fan.speed * 100) : 0
  }

  set value (target: number) {
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

  rules = [
    (v: string) => {
      if (this.offBelow <= 0) return true
      return (parseFloat(v) >= this.offBelow || parseFloat(v) === 0) || 'min error'
    }
  ]
}
</script>
