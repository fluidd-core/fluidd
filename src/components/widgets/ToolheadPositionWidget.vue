<template>
  <v-card class="pa-4">
    <v-row no-gutters>
      <v-col cols="12" lg="4" class="d-flex align-center justify-space-around">
        <div class="text-subtitle-1 grey--text text--darken-1 mr-2">X</div>
        <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[0].toFixed(2) }}</div>
      </v-col>
      <v-col cols="12" lg="4" class="d-flex align-center justify-space-around">
        <div class="text-subtitle-1 grey--text text--darken-1 mr-2">Y</div>
        <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[1].toFixed(2) }}</div>
      </v-col>
      <v-col cols="12" lg="4" class="d-flex align-center justify-space-around">
        <div class="text-subtitle-1 grey--text text--darken-1 mr-2">Z</div>
        <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[2].toFixed(2) }}</div>
      </v-col>
    </v-row>
  </v-card>
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
