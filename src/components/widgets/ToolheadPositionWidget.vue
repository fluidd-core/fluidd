<template>
  <v-container>
    <v-row>
      <v-col class="pa-2 pt-0">

        <v-card class="d-flex flex-column flex-sm-row justify-space-around pa-4">
          <div class="d-flex flex-row align-center justify-space-between">
            <div class="text-subtitle-1 grey--text text--darken-1 mr-2">X</div>
            <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[0].toFixed(2) }}</div>
          </div>

          <div class="d-flex flex-row align-center justify-space-between">
            <div class="text-subtitle-1 grey--text text--darken-1 mr-2">Y</div>
            <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[1].toFixed(2) }}</div>
          </div>

          <div class="d-flex flex-row align-center justify-space-between">
            <div class="text-subtitle-1 grey--text text--darken-1 mr-2">Z</div>
            <div class="grey--text text--lighten-1 text-h5">{{ toolheadPosition[2].toFixed(2) }}</div>
          </div>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
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
