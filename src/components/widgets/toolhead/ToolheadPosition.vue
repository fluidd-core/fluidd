<template>
  <div class="mb-2">
    <!-- <div style="line-height: 32px; padding: 0 12px;"> -->
      <v-row no-gutters class="mb-2">
        <v-col cols="auto" align-self="center" class="focus--text mr-2">
          X
        </v-col>
        <v-col cols="auto" align-self="center" class="mr-2">
          <v-text-field
            outlined
            hide-details
            single-line
            dense
            class="v-input--width-small"
            @change="moveTo('X', $event)"
            :readonly="printerBusy"
            :value="gcodePosition[0].toFixed(2)"
          ></v-text-field>
        </v-col>
        <v-col cols="auto" align-self="center" class="focus--text">
          {{ toolheadPosition[0].toFixed(2) }}
        </v-col>
      </v-row>

      <v-row no-gutters class="mb-2">
        <v-col cols="auto" align-self="center" class="focus--text mr-2">
          Y
        </v-col>
        <v-col cols="auto" align-self="center" class="mr-2">
          <v-text-field
            outlined
            hide-details
            single-line
            dense
            class="v-input--width-small"
            @change="moveTo('Y', $event)"
            :readonly="printerBusy"
            :value="gcodePosition[1].toFixed(2)"
          ></v-text-field>
        </v-col>
        <v-col cols="auto" align-self="center" class="focus--text">
          {{ toolheadPosition[1].toFixed(2) }}
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col cols="auto" align-self="center" class="focus--text mr-2">
          Z
        </v-col>
        <v-col cols="auto" align-self="center" class="mr-2">
          <v-text-field
            outlined
            hide-details
            single-line
            dense
            class="v-input--width-small"
            @change="moveTo('Z', $event)"
            :readonly="printerBusy"
            :value="gcodePosition[2].toFixed(2)"
          ></v-text-field>
        </v-col>
        <v-col cols="auto" align-self="center" class="focus--text">
          {{ toolheadPosition[2].toFixed(2) }}
        </v-col>
      </v-row>

      <!-- <v-row justify="space-between" align="center" no-gutters v-show="printerPrinting">
        <v-col cols="auto" class="secondary--text text--lighten-1">
          {{ $t('app.general.label.requested_speed') }}
        </v-col>
        <v-col cols="auto" class="focus--text">
          {{ requestedSpeed }} mm/s
        </v-col>
      </v-row> -->

    <!-- </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class ToolheadPosition extends Mixins(StateMixin) {
  get gcodePosition () {
    return this.$store.state.printer.printer.gcode_move.gcode_position
  }

  get toolheadPosition () {
    return this.$store.state.printer.printer.toolhead.position
  }

  get useGcodeCoords () {
    return this.$store.state.config.uiSettings.general.useGcodeCoords
  }

  get requestedSpeed () {
    // Take into account the speed multiplier.
    const multiplier = this.$store.state.printer.printer.gcode_move.speed_factor || 1
    let speed = this.$store.state.printer.printer.gcode_move.speed || 0
    speed = (speed * multiplier) / 60
    return speed.toFixed()
  }

  moveTo (axis: string, pos: string) {
    const axisIndexMap: any = { X: 0, Y: 1, Z: 2 }
    const currentPos = (this.useGcodeCoords)
      ? this.gcodePosition[axisIndexMap[axis]]
      : this.toolheadPosition[axisIndexMap[axis]]
    if (parseInt(currentPos) !== parseInt(pos)) {
      const rate = this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
      this.sendGcode(`G90
        G1 ${axis}${pos} F${rate * 60}`)
    }
  }
}
</script>

<style type="scss" scoped>
  .coord-wrapper {
    line-height: 32px;
    padding: 0 12px;
  }
  /* .coord-col {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    max-height: 36px;
  } */
</style>
