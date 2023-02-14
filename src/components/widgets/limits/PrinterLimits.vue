<template>
  <!-- Speed and Flow Adjust -->
  <div>
    <v-card-text class="mb-0">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-named-slider
            :label="$t('app.general.label.velocity')"
            :value="velocity.current"
            :reset-value="velocity.max"
            :min="1"
            :max="velocity.max"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="isMobile"
            :loading="hasWait($waits.onSetVelocity)"
            suffix="mm/s"
            @change="setVelocity($event)"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-named-slider
            :label="$t('app.general.label.sqv')"
            :value="scv.current"
            :reset-value="scv.max"
            :min="0"
            :max="scv.max"
            :step="0.1"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="isMobile"
            :loading="hasWait($waits.onSetSCV)"
            suffix="mm/s"
            @change="setSCV($event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-named-slider
            :label="$t('app.general.label.acceleration')"
            :value="accel.current"
            :reset-value="accel.max"
            :min="1"
            :max="accel.max"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="isMobile"
            :loading="hasWait($waits.onSetAcceleration)"
            suffix="mm/s²"
            @change="setAcceleration($event)"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-named-slider
            :label="$t('app.general.label.accel_to_decel')"
            :value="decel.current"
            :reset-value="decel.max"
            :min="1"
            :max="decel.max"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="isMobile"
            :loading="hasWait($waits.onSetDeceleration)"
            suffix="mm/s²"
            @change="setDeceleration($event)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class PrinterLimits extends Mixins(StateMixin) {
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
    this.sendGcode(`SET_VELOCITY_LIMIT VELOCITY=${val}`, this.$waits.onSetVelocity)
  }

  setAcceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL=${val}`, this.$waits.onSetAcceleration)
  }

  setDeceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL_TO_DECEL=${val}`, this.$waits.onSetDeceleration)
  }

  setSCV (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=${val}`, this.$waits.onSetSCV)
  }
}
</script>
