<template>
  <v-expansion-panels flat>
    <v-expansion-panel>
      <v-expansion-panel-header>Acceleration, Velocity &amp; Limits</v-expansion-panel-header>
      <v-expansion-panel-content>
        <!-- <v-col>
          Velocity Limits
          These are not persistent. They will reset to your printer configuration on host reboot.
          <v-divider></v-divider>
        </v-col> -->
        <!-- Speed and Flow Adjust -->
        <v-row>
          <v-col cols="12" sm="6" class="px-2 pt-0 pb-5">
            <input-slider
              label="Velocity"
              value-suffix="mm/s"
              :value="velocity.current"
              :min="0"
              :max="velocity.max"
              :disabled="!klippyConnected"
              :loading="hasWait(waits.onSetVelocity)"
              @input="setVelocity($event)">
            </input-slider>
          </v-col>
          <v-col cols="12" sm="6" class="px-2 pt-0 pb-5">
            <input-slider
              label="Square Corner Velocity"
              value-suffix="mm/s"
              :value="scv.current"
              :min="0"
              :max="scv.max"
              :disabled="!klippyConnected"
              :loading="hasWait(waits.onSetSQV)"
              @input="setSCV($event)">
            </input-slider>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" sm="6" class="px-2 py-0">
            <input-slider
              label="Acceleration"
              value-suffix="mm/s^2"
              :value="accel.current"
              :min="0"
              :max="accel.max"
              :disabled="!klippyConnected"
              :loading="hasWait(waits.onSetAcceleration)"
              @input="setAcceleration($event)">
            </input-slider>
          </v-col>
          <v-col cols="12" sm="6" class="px-2 py-0">
            <input-slider
              label="Deceleration"
              value-suffix="mm/s^2"
              :value="decel.current"
              :min="0"
              :max="decel.max"
              :disabled="!klippyConnected"
              :loading="hasWait(waits.onSetDeceleration)"
              @input="setDeceleration($event)">
            </input-slider>
          </v-col>
        </v-row>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import InputSlider from '@/components/inputs/InputSlider.vue'

@Component({
  components: {
    InputSlider
  }
})
export default class PrinterLimitsWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get velocity () {
    const max = parseInt(this.$store.state.socket.printer.configfile.config.printer.max_velocity)
    return {
      current: this.$store.state.socket.printer.toolhead.max_velocity,
      max
    }
  }

  get accel () {
    const max = parseInt(this.$store.state.socket.printer.configfile.config.printer.max_accel)
    return {
      current: this.$store.state.socket.printer.toolhead.max_accel,
      max
    }
  }

  get decel () {
    const max = parseFloat(this.$store.state.socket.printer.configfile.config.printer.max_accel_to_decel) || this.accel.max / 2 // klippers default is half of accel
    return {
      current: this.$store.state.socket.printer.toolhead.max_accel_to_decel,
      max
    }
  }

  get scv () {
    const max = parseInt(this.$store.state.socket.printer.configfile.config.printer.square_corner_velocity) || 5 // klippers default is 5.
    return {
      current: this.$store.state.socket.printer.toolhead.square_corner_velocity,
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

  /**
   * SET_VELOCITY_LIMIT
   * [VELOCITY=<value>]
   * [ACCEL=<value>]
   * [ACCEL_TO_DECEL=<value>]
   * [SQUARE_CORNER_VELOCITY=<value>]:
   * Modify the printer's velocity limits. Note that one may only set values less than or equal to the limits specified in the config file.
   */
}
</script>
