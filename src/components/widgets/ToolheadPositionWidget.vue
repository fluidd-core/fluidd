<template>
  <v-card class="px-4 py-2 mb-2">
    <v-row>
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mx-2">X:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[0].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mx-2">Y:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[1].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="4" class="coord-col">
        <div class="grey--text text--darken-1 mx-2">Z:</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[2].toFixed(2) }}
        </div>
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
}
</script>

<style type="scss" scoped>
  .coord-col {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    justify-items: center;
    align-items: center;
    max-height: 36px;
    /* d-flex flex-row justify-center align-center */
  }
</style>
