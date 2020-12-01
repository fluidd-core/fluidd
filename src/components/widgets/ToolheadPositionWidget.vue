<template>
  <v-card class="px-4 py-2">
    <v-row no-gutters>
      <v-col cols="12" lg="4" class="d-flex flex-row justify-start justify-lg-space-around flex-lg-column align-center">
        <div class="text-subtitle-1 grey--text text--darken-1 mx-2">X</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[0].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="12" lg="4" class="d-flex flex-row justify-start justify-lg-space-around flex-lg-column align-center">
        <div class="text-subtitle-1 grey--text text--darken-1 mx-2">Y</div>
        <div class="grey--text focus--text">
          {{ toolheadPosition[1].toFixed(2) }}
        </div>
      </v-col>
      <v-col cols="12" lg="4" class="d-flex flex-row justify-start justify-lg-space-around flex-lg-column align-center">
        <div class="text-subtitle-1 grey--text text--darken-1 mx-2">Z</div>
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
  get toolheadPosition () {
    return this.$store.state.socket.printer.toolhead.position
  }
}
</script>

<style type="scss" scoped>
</style>
