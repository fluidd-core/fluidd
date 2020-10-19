<template>
  <v-container>
    <v-row>
      <v-col cols="12" lg="4" class="pt-0 pa-2">
        <v-layout flex-column>
          <v-btn
            @click="sendRetractGcode(extrudeLength, extrudeSpeed, waits.onExtract)"
            :disabled="hasWaits || !extrudeRetractReady || !klippyConnected"
            block
            color="secondary"
            class="mb-4">
            Retract
            <v-icon>{{ icons.chevronUp }}</v-icon>
          </v-btn>
          <v-btn
            @click="sendExtrudeGcode(extrudeLength, extrudeSpeed, waits.onExtrude)"
            :disabled="hasWaits || !extrudeRetractReady || !klippyConnected"
            block
            color="secondary">
            Extrude
            <v-icon>{{ icons.chevronDown }}</v-icon>
          </v-btn>
        </v-layout>
      </v-col>
      <v-col cols="12" lg="4" class="pa-2 pt-0" v-if="!extrudeRetractReady">
        <v-alert dense text type="error" class="mb-0" elevation="2">below {{ minExtrudeTemp }}<small>°C</small></v-alert>
      </v-col>
      <v-col cols="12" lg="4" class="pa-2 pt-0 flex-column">
        <v-text-field
          v-model="extrudeLength"
          :disabled="!klippyConnected"
          solo
          dense
          hide-details
          label="Extrude Length"
          type="number"
          suffix="mm"
          class="mb-3">
        </v-text-field>
        <v-text-field
          v-model="extrudeSpeed"
          :disabled="!klippyConnected"
          solo
          dense
          hide-details
          label="Extrude Speed"
          suffix="mm/s"
          class="">
        </v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({})
export default class ToolheadMovesWidget extends Mixins(UtilsMixin) {
  waits = Waits
  feedSpeed = -1
  feedLength = -1

  get extrudeSpeed () {
    return (this.feedSpeed === -1)
      ? this.$store.state.config.fileConfig.general.defaultExtrudeSpeed
      : this.feedSpeed
  }

  set extrudeSpeed (val: number) {
    this.feedSpeed = val
  }

  get extrudeLength () {
    return (this.feedLength === -1)
      ? this.$store.state.config.fileConfig.general.defaultExtrudeLength
      : this.feedLength
  }

  set extrudeLength (val: number) {
    this.feedLength = val
  }

  get extruder () {
    return this.$store.state.socket.printer.extruder
  }

  get minExtrudeTemp () {
    return (this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp)
      ? this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp
      : 170 // Default to a sane value
  }

  /**
   * Ensures our temps are high enough to extrude or retract.
   */
  get extrudeRetractReady () {
    return (this.extruder && this.minExtrudeTemp)
      ? (this.extruder.temperature > this.minExtrudeTemp)
      : false
  }
}
</script>

<style type="scss" scoped>
</style>
