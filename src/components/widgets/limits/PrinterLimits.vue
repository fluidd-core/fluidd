<template>
  <!-- Speed and Flow Adjust -->
  <v-card-text>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.velocity')"
          value-suffix="mm/s"
          input-sm
          :value="velocity.current"
          :min="1"
          :max="velocity.max"
          :rules="[rules.min1, rules.velocityMax]"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetVelocity)"
          @input="setVelocity($event)">
        </app-slider>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.sqv')"
          value-suffix="mm/s"
          input-sm
          :value="scv.current"
          :min="0"
          :step="0.1"
          :max="scv.max"
          :rules="[rules.min0, rules.scvMax]"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetSQV)"
          @input="setSCV($event)">
        </app-slider>
      </v-col>
    </v-row>
    <v-row class="my-0">
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.acceleration')"
          value-suffix="mm/s^2"
          input-sm
          :value="accel.current"
          :min="1"
          :max="accel.max"
          :rules="[rules.min1, rules.accelMax]"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetAcceleration)"
          @input="setAcceleration($event)">
        </app-slider>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.accel_to_decel')"
          value-suffix="mm/s^2"
          input-sm
          :value="decel.current"
          :min="1"
          :max="decel.max"
          :rules="[rules.min1, rules.decelMax]"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetDeceleration)"
          @input="setDeceleration($event)">
        </app-slider>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class PrinterLimits extends Mixins(StateMixin) {
  waits = Waits

  rules = {
    min0: (v: string) => {
      return (parseInt(v) >= 0) || this.$t('app.general.simple_form.error.min', { min: 0 })
    },
    min1: (v: string) => {
      return (parseInt(v) >= 1) || this.$t('app.general.simple_form.error.min', { min: 1 })
    },
    velocityMax: (v: string) => {
      return (parseInt(v) <= this.velocity.max) || this.$t('app.general.simple_form.error.max', { max: this.velocity.max })
    },
    scvMax: (v: string) => {
      return (parseInt(v) <= this.scv.max) || this.$t('app.general.simple_form.error.max', { max: this.scv.max })
    },
    accelMax: (v: string) => {
      return (parseInt(v) <= this.accel.max) || this.$t('app.general.simple_form.error.max', { max: this.accel.max })
    },
    decelMax: (v: string) => {
      return (parseInt(v) <= this.decel.max) || this.$t('app.general.simple_form.error.max', { max: this.decel.max })
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

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
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
