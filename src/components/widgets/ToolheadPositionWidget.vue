<template>
  <v-card class="px-4 py-2 mb-2">
    <v-row justify="space-between">
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mr-1">X:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[0].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mr-1">Y:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[1].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mr-1">Z:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[2].toFixed(2) }}
        </div>
      </v-col>
    </v-row>
    <v-row justify="space-around" v-show="printerPrinting">
      <v-col cols="12" class="coord-col">
        <span class="grey--text text--darken-1">Requested Speed:</span>
        <span class="grey--text focus--text">
          {{ requestedSpeed }} mm/s
        </span>
      </v-col>
    </v-row>
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
    const speed = this.$store.state.socket.printer.gcode_move.speed | 0
    return (speed / 60).toFixed()
  }
}
</script>

<style type="scss" scoped>
  .coord-col {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    max-height: 36px;
  }
</style>
