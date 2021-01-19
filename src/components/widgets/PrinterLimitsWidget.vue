<template>
  <!-- Speed and Flow Adjust -->
  <v-card-text>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="6" class="py-0">
        <input-slider
          :label="$t('Velocity')"
          value-suffix="mm/s"
          input-sm
          :value="velocity.current"
          :min="1"
          :max="velocity.max"
          :rules="[rules.min1, rules.velocityMax]"
          :disabled="!klippyReady"
          :loading="hasWait(waits.onSetVelocity)"
          @input="setVelocity($event)">
        </input-slider>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <input-slider
          :label="$t('Square Corner Velocity')"
          value-suffix="mm/s"
          input-sm
          :value="scv.current"
          :min="0"
          :step="0.1"
          :max="scv.max"
          :rules="[rules.min0, rules.scvMax]"
          :disabled="!klippyReady"
          :loading="hasWait(waits.onSetSQV)"
          @input="setSCV($event)">
        </input-slider>
      </v-col>
    </v-row>
    <v-row class="my-0">
      <v-col cols="12" sm="6" class="py-0">
        <input-slider
          :label="$t('Acceleration')"
          value-suffix="mm/s^2"
          input-sm
          :value="accel.current"
          :min="1"
          :max="accel.max"
          :rules="[rules.min1, rules.accelMax]"
          :disabled="!klippyReady"
          :loading="hasWait(waits.onSetAcceleration)"
          @input="setAcceleration($event)">
        </input-slider>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <input-slider
          :label="$t('Accel to Decel')"
          value-suffix="mm/s^2"
          input-sm
          :value="decel.current"
          :min="1"
          :max="decel.max"
          :rules="[rules.min1, rules.decelMax]"
          :disabled="!klippyReady"
          :loading="hasWait(waits.onSetDeceleration)"
          @input="setDeceleration($event)">
        </input-slider>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'
import InputSlider from '@/components/inputs/InputSlider.vue'

@Component({
  components: {
    InputSlider
  }
})
export default class PrinterLimitsWidget extends Mixins(StateMixin) {
  waits = Waits

  rules = {
    min0: (v: string) => {
      return (parseInt(v) >= 0) || this.$t('min 0')
    },
    min1: (v: string) => {
      return (parseInt(v) >= 1) || this.$t('min 1')
    },
    velocityMax: (v: string) => {
      return (parseInt(v) <= this.velocity.max) || this.$t('max %{velocityMax}', { velocityMax: this.velocity.max })
    },
    scvMax: (v: string) => {
      return (parseInt(v) <= this.scv.max) || this.$t('min %{scvMax}', { scvMax: this.scv.max })
    },
    accelMax: (v: string) => {
      return (parseInt(v) <= this.accel.max) || this.$t('min %{accelMax}', { accelMax: this.accel.max })
    },
    decelMax: (v: string) => {
      return (parseInt(v) <= this.decel.max) || this.$t('min 0%{decelMax}', { decelMax: this.decel.max })
    }
  }

  get velocity () {
    const max = this.$store.getters['printer/getPrinterSettings']('printer.max_velocity')
    return {
      current: this.$store.state.printer.printer.toolhead.max_velocity,
      max
    }
  }

  get accel () {
    const max = this.$store.getters['printer/getPrinterSettings']('printer.max_accel')
    return {
      current: this.$store.state.printer.printer.toolhead.max_accel,
      max
    }
  }

  get decel () {
    const max = this.$store.getters['printer/getPrinterSettings']('printer.max_accel_to_decel') || this.accel.max / 2
    return {
      current: this.$store.state.printer.printer.toolhead.max_accel_to_decel,
      max
    }
  }

  get scv () {
    const max = this.$store.getters['printer/getPrinterSettings']('printer.square_corner_velocity') || 5
    return {
      current: this.$store.state.printer.printer.toolhead.square_corner_velocity,
      max
    }
  }

  setVelocity (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT VELOCITY=${val}`, Waits.onSetVelocity)
  }

  setAcceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL=${val}`, Waits.onSetAcceleration)
  }

  setDeceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL_TO_DECEL=${val}`, Waits.onSetDeceleration)
  }

  setSCV (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=${val}`, Waits.onSetSCV)
  }
}
</script>
