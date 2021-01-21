<template>
  <v-row align="center" justify="end">
    <!-- <v-col cols="auto">
      <div class="grey--text text--darken-1">Offset Z</div>
      <div class="grey--text text--lighten-1">{{ ZHomingOrigin }}mm</div>
    </v-col> -->
    <v-col cols="auto">
      <v-btn
        @click="sendZAdjustGcode('+', moveDistance, waits.onZAdjust)"
        :loading="hasWait('ZAdjust')"
        small
        color="secondary">
        <v-icon small class="mx-0">$upCollapse</v-icon>
      </v-btn>
      <v-btn
        @click="sendZAdjustGcode('-', moveDistance, waits.onZAdjust)"
        :loading="hasWait('ZAdjust')"
        small
        class="ml-1"
        color="secondary">
        <v-icon small>$downCollapse</v-icon>
      </v-btn>
      <v-btn-toggle mandatory dense v-model="moveDistance" class="ml-2 d-inline-block">
        <v-btn color="secondary" small value="0.01" class="px-2">0.01</v-btn>
        <v-btn color="secondary" small value="0.05" class="px-3">0.05</v-btn>
      </v-btn-toggle>
      <div class="mt-1">
        <span class="grey--text text--darken-1">Z Offset: </span>
        <span class="grey--text text--lighten-1">{{ ZHomingOrigin }}mm</span>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({})
export default class ZHeightAdjustWidget extends Mixins(UtilsMixin) {
  waits = Waits
  moveDistance = '0.1'

  get ZHomingOrigin () {
    // This is an array of 4 values, representing the homing origin.
    // It should be in the order of; X, Y, Z, E.
    if (
      this.$store.state.socket.printer.gcode_move.homing_origin &&
      this.$store.state.socket.printer.gcode_move.homing_origin.length >= 4
    ) {
      const origin = this.$store.state.socket.printer.gcode_move.homing_origin[2]
      return origin.toFixed(3)
    } else {
      return null
    }
  }
}
</script>
