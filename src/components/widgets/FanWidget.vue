<template>
  <div>
    <input-slider
      value-suffix="%"
      input-xs
      :label="fan.prettyName"
      :value="fan.speed * 100"
      :rules="rules"
      :disabled="!klippyConnected"
      :readonly="!fan.controllable"
      @input="setFanSpeed(fan, $event)">
    </input-slider>
    <v-divider class="my-1" v-if="divider"></v-divider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { Fan } from '@/store/socket/types'

@Component({
  components: {
    InputSlider
  }
})
export default class FanWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Object, required: true })
  fan!: Fan

  @Prop({ type: Boolean, default: false })
  divider!: boolean

  get config () {
    return this.$store.state.socket.printer.configfile.config[this.fan.name]
  }

  get offBelow () {
    const offBelow = parseFloat(this.config.off_below) || 0
    return offBelow * 100
  }

  rules = [
    (v: string) => {
      if (this.offBelow <= 0) return true
      return (parseInt(v) >= this.offBelow || parseInt(v) === 0) || 'min error'
    }
  ]

  setFanSpeed (fan: Fan, target: number) {
    // If this is a controllable fan, it's either the part fan [fan] or a generic fan [fan_generic].
    if (fan.type === 'fan') {
      target = Math.ceil(target * 2.55)
      this.sendGcode(`M106 S${target}`, Waits.onSetFanSpeed)
    }
    if (fan.type === 'fan_generic') {
      target = target / 100
      this.sendGcode(`SET_FAN_SPEED FAN=${fan.name} SPEED=${target}`, Waits.onSetFanSpeed)
    }
  }
}
</script>
