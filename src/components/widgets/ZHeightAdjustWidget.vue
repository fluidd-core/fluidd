<template>
  <v-row dense class="pt-0">
    <v-col class="d-flex flex-column pt-0" cols="auto">
      <v-btn
        @click="sendZAdjustGcode('+', moveDistance, waits.onZAdjust)"
        :min-width="80"
        :elevation="2"
        :loading="hasWait('ZAdjust')"
        class="pa-0 mb-2"
        color="secondary">
        <v-icon small>$upCollapse</v-icon>
      </v-btn>
      <v-btn
        @click="sendZAdjustGcode('-', moveDistance, waits.onZAdjust)"
        :min-width="80"
        :elevation="2"
        :loading="hasWait('ZAdjust')"
        class="pa-0"
        color="secondary">
        <v-icon small>$downCollapse</v-icon>
      </v-btn>
    </v-col>
    <v-col class="d-flex flex-column justify-center pt-0" cols="auto">
      <div class="grey--text text--darken-1">Offset Z</div>
      <div class="grey--text text--lighten-1">{{ ZHomingOrigin }}mm</div>
    </v-col>
    <v-col class="d-flex flex-column justify-center pt-0" cols="auto">
      <v-btn-toggle mandatory dense v-model="moveDistance">
        <v-btn color="secondary" value="0.01">0.01</v-btn>
        <v-btn color="secondary" value="0.05">0.05</v-btn>
      </v-btn-toggle>
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

<style type="scss" scoped>
</style>
