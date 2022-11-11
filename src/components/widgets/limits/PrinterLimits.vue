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
          <app-slider
            v-model="velocity"
            :label="$t('app.general.label.velocity')"
            :reset-value="maxVelocity"
            :min="1"
            :max="maxVelocity"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="!klippyReady || isMobile"
            :loading="hasWait($waits.onSetVelocity)"
            suffix="mm/s"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-slider
            v-model="squareCornerVelocity"
            :label="$t('app.general.label.sqv')"
            :reset-value="maxSquareCornerVelocity"
            :min="0"
            :max="maxSquareCornerVelocity"
            :step="0.1"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="!klippyReady || isMobile"
            :loading="hasWait($waits.onSetSCV)"
            suffix="mm/s"
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
          <app-slider
            v-model="acceleration"
            :label="$t('app.general.label.acceleration')"
            :reset-value="maxAcceleration"
            :min="1"
            :max="maxAcceleration"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="!klippyReady || isMobile"
            :loading="hasWait($waits.onSetAcceleration)"
            suffix="mm/s²"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-slider
            v-model="deceleration"
            :label="$t('app.general.label.accel_to_decel')"
            :reset-value="maxDeceleration"
            :min="1"
            :max="maxDeceleration"
            :disabled="!klippyReady"
            :overridable="true"
            :locked="!klippyReady || isMobile"
            :loading="hasWait($waits.onSetDeceleration)"
            suffix="mm/s²"
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
    return this.$store.state.printer.printer.toolhead.max_velocity
  }

  set velocity (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT VELOCITY=${val}`, this.$waits.onSetVelocity)
  }

  get maxVelocity () {
    return this.$store.getters['printer/getPrinterSettings']('printer.max_velocity')
  }

  get acceleration () {
    return this.$store.state.printer.printer.toolhead.max_accel
  }

  set acceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL=${val}`, this.$waits.onSetAcceleration)
  }

  get maxAcceleration () {
    return this.$store.getters['printer/getPrinterSettings']('printer.max_accel')
  }

  get deceleration () {
    return this.$store.state.printer.printer.toolhead.max_accel_to_decel
  }

  set deceleration (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL_TO_DECEL=${val}`, this.$waits.onSetDeceleration)
  }

  get maxDeceleration () {
    return this.$store.getters['printer/getPrinterSettings']('printer.max_accel_to_decel') || this.maxAcceleration / 2
  }

  get squareCornerVelocity () {
    return this.$store.state.printer.printer.toolhead.square_corner_velocity
  }

  set squareCornerVelocity (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=${val}`, this.$waits.onSetSCV)
  }

  get maxSquareCornerVelocity () {
    return this.$store.getters['printer/getPrinterSettings']('printer.square_corner_velocity') || 5
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
