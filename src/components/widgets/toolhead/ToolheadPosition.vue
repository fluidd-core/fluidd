<template>
  <div class="mb-2">
    <!-- <div style="line-height: 32px; padding: 0 12px;"> -->
      <v-row justify="space-between" no-gutters>
        <v-col cols="4" class="pr-1">
          <v-text-field
            label="X"
            outlined
            hide-details
            dense
            class="v-input--width-small"
            @change="moveTo('X', $event)"
            :readonly="printerBusy"
            :value="(useGcodeCoords) ? gcodePosition[0].toFixed(2) : toolheadPosition[0].toFixed(2)"
          ></v-text-field>
          <!-- <span class="secondary--text text--lighten-1">X:</span> -->
          <!-- <span class="dim--text focus--text">
            {{ ((useGcodeCoords) ? gcodePosition[0].toFixed(2) : toolheadPosition[0].toFixed(2)) }}
          </span> -->
        </v-col>
        <v-col cols="4" class="pr-1 pl-1">
          <v-text-field
            label="Y"
            outlined
            hide-details
            dense
            class="v-input--width-small"
            @change="moveTo('Y', $event)"
            :readonly="printerBusy"
            :value="(useGcodeCoords) ? gcodePosition[1].toFixed(2) : toolheadPosition[1].toFixed(2)"
          ></v-text-field>
          <!-- <span class="secondary--text text--lighten-1">Y:</span> -->
          <!-- <span class="dim--text focus--text">
            {{ ((useGcodeCoords) ? gcodePosition[1].toFixed(2) : toolheadPosition[1].toFixed(2)) }}
          </span> -->
        </v-col>
        <v-col cols="4" class="pl-1">
          <v-text-field
            label="Z"
            outlined
            hide-details
            dense
            class="v-input--width-small"
            @change="moveTo('Z', $event)"
            :readonly="printerBusy"
            :value="(useGcodeCoords) ? gcodePosition[2].toFixed(2) : toolheadPosition[2].toFixed(2)"
          ></v-text-field>
          <!-- <span class="secondary--text text--lighten-1">Z:</span>
          <span class="dim--text focus--text">
            {{ ((useGcodeCoords) ? gcodePosition[2].toFixed(2) : toolheadPosition[2].toFixed(2)) }}
          </span> -->
        </v-col>
      </v-row>

      <v-row justify="space-between" align="center" no-gutters v-show="printerPrinting">
        <v-col cols="auto" class="secondary--text text--lighten-1">
          {{ $t('app.general.label.requested_speed') }}
        </v-col>
        <v-col cols="auto" class="dim--text focus--text">
          {{ requestedSpeed }} mm/s
        </v-col>
      </v-row>

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
