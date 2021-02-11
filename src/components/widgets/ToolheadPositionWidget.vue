<template>
  <v-card outlined class="mb-2">
    <div style="line-height: 32px; padding: 0 12px;">
      <v-row justify="space-between" no-gutters>
        <v-col cols="auto">
          <span class="secondary--text text--lighten-1">X:</span>
          <span class="grey--text focus--text">
            {{ toolheadPosition[0].toFixed(2) }}
          </span>
        </v-col>
        <v-col cols="auto">
          <span class="secondary--text text--lighten-1">Y:</span>
          <span class="grey--text focus--text">
            {{ toolheadPosition[1].toFixed(2) }}
          </span>
        </v-col>
        <v-col cols="auto">
          <span class="secondary--text text--lighten-1">Z:</span>
          <span class="grey--text focus--text">
            {{ toolheadPosition[2].toFixed(2) }}
          </span>
        </v-col>
      </v-row>

      <v-row justify="space-between" align="center" no-gutters v-show="printerPrinting">
        <v-col cols="auto" class="secondary--text text--lighten-1">
          Requested Speed:
        </v-col>
        <v-col cols="auto" class="grey--text focus--text">
          {{ requestedSpeed }} mm/s
        </v-col>
      </v-row>

    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class ToolheadPositionWidget extends Mixins(UtilsMixin) {
  get gcodePosition () {
    return this.$store.state.socket.printer.gcode_move.gcode_position
  }

  get toolheadPosition () {
    return this.$store.state.socket.printer.toolhead.position
  }

  get requestedSpeed () {
    // Take into account the speed multiplier.
    const multiplier = this.$store.state.socket.printer.gcode_move.speed_factor | 100
    let speed = this.$store.state.socket.printer.gcode_move.speed | 0
    speed = (speed * multiplier) / 60
    return speed.toFixed()
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
