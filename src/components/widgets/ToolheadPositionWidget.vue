<template>
  <v-row>
    <v-col class="pa-2">

      <v-card class="xyzLabels d-flex py-3">
        <v-col class="d-flex flex-column align-center py-0 px-2">
          <div class="text-subtitle-1 grey--text text--darken-1">X</div>
          <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[0].toFixed(2) }}</div>
        </v-col>

        <v-col class="d-flex flex-column align-center py-0 px-2">
          <div class="text-subtitle-1 grey--text text--darken-1">Y</div>
          <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[1].toFixed(2) }}</div>
        </v-col>

        <v-col class="d-flex flex-column align-center py-0 px-2">
          <div class="text-subtitle-1 grey--text text--darken-1">Z</div>
          <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[2].toFixed(2) }}</div>
        </v-col>
      </v-card>
    </v-col>

  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class ToolheadPositionWidget extends Mixins(UtilsMixin) {
  get toolheadPosition () {
    return this.$store.state.socket.printer.toolhead.position
  }
}
</script>

<style type="scss" scoped>
</style>
