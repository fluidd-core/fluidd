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
            :value="velocity"
            :reset-value="defaultVelocity"
            :min="1"
            :max="defaultVelocity"
            :disabled="!klippyReady"
            overridable
            :locked="isMobileViewport"
            :loading="hasWait($waits.onSetVelocity)"
            suffix="mm/s"
            @submit="setVelocity"
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
            :value="squareCornerVelocity"
            :reset-value="defaultSquareCornerVelocity"
            :min="0"
            :max="defaultSquareCornerVelocity"
            :step="0.1"
            :disabled="!klippyReady"
            overridable
            :locked="isMobileViewport"
            :loading="hasWait($waits.onSetSquareCornerVelocity)"
            suffix="mm/s"
            @submit="setSquareCornerVelocity"
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
            :value="accel"
            :reset-value="defaultAccel"
            :min="1"
            :max="defaultAccel"
            :disabled="!klippyReady"
            overridable
            :locked="isMobileViewport"
            :loading="hasWait($waits.onSetAcceleration)"
            suffix="mm/s²"
            @submit="setAccel"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="12"
          lg="6"
        >
          <app-named-slider
            v-if="minimumCruiseRatio != null"
            :label="$t('app.general.label.minimum_cruise_ratio')"
            :value="minimumCruiseRatio"
            :reset-value="defaultMinimumCruiseRatio"
            :min="0"
            :max="99"
            :disabled="!klippyReady"
            :locked="isMobileViewport"
            :loading="hasWait($waits.onSetMinimumCruiseRatio)"
            suffix="%"
            @submit="setMinimumCruiseRatio"
          />

          <app-named-slider
            v-else-if="accelToDecel != null"
            :label="$t('app.general.label.accel_to_decel')"
            :value="accelToDecel"
            :reset-value="defaultAccelToDecel"
            :min="1"
            :max="defaultAccelToDecel"
            :disabled="!klippyReady"
            overridable
            :locked="isMobileViewport"
            :loading="hasWait($waits.onSetAccelToDecel)"
            suffix="mm/s²"
            @submit="setAccelToDecel"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class PrinterLimits extends Mixins(StateMixin, BrowserMixin) {
  get defaultVelocity (): number {
    return this.$store.getters['printer/getPrinterSettings']('printer.max_velocity') as number
  }

  get velocity (): number {
    return this.$store.state.printer.printer.toolhead.max_velocity as number
  }

  get defaultAccel (): number {
    return this.$store.getters['printer/getPrinterSettings']('printer.max_accel')
  }

  get accel (): number {
    return this.$store.state.printer.printer.toolhead.max_accel as number
  }

  get defaultAccelToDecel (): number {
    const defaultAccelToDecel = this.$store.getters['printer/getPrinterSettings']('printer.max_accel_to_decel') as number | undefined

    return defaultAccelToDecel ?? this.defaultAccel / 2
  }

  get accelToDecel (): number | undefined {
    return this.$store.state.printer.printer.toolhead.max_accel_to_decel as number | undefined
  }

  get defaultMinimumCruiseRatio (): number {
    const defaultMinimumCruiseRatio = this.$store.getters['printer/getPrinterSettings']('printer.minimum_cruise_ratio') as number | undefined

    return Math.round((defaultMinimumCruiseRatio ?? 0.5) * 100)
  }

  get minimumCruiseRatio (): number | undefined {
    const minimumCruiseRatio = this.$store.state.printer.printer.toolhead.minimum_cruise_ratio as number | undefined

    return minimumCruiseRatio != null
      ? Math.round(minimumCruiseRatio * 100)
      : undefined
  }

  get defaultSquareCornerVelocity (): number {
    return this.$store.getters['printer/getPrinterSettings']('printer.square_corner_velocity') as number || 5
  }

  get squareCornerVelocity () {
    return this.$store.state.printer.printer.toolhead.square_corner_velocity as number
  }

  setVelocity (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT VELOCITY=${val}`, this.$waits.onSetVelocity)
  }

  setAccel (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL=${val}`, this.$waits.onSetAcceleration)
  }

  setAccelToDecel (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ACCEL_TO_DECEL=${val}`, this.$waits.onSetAccelToDecel)
  }

  setMinimumCruiseRatio (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=${val / 100}`, this.$waits.onSetMinimumCruiseRatio)
  }

  setSquareCornerVelocity (val: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=${val}`, this.$waits.onSetSquareCornerVelocity)
  }
}
</script>
