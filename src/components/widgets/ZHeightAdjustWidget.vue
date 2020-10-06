<template>
  <v-container>
    <v-row>
      <v-col class="pa-0" cols="auto">
        <v-btn
          @click="sendZAdjustGcode('+', moveDistance, waits.onZAdjust)"
          :min-width="40"
          :loading="hasWait('ZAdjust')"
          class="pa-0 mb-2"
          color="secondary">
          <v-icon>mdi-arrow-collapse-up</v-icon>
        </v-btn><br />
        <v-btn
          @click="sendZAdjustGcode('-', moveDistance, waits.onZAdjust)"
          :min-width="40"
          :loading="hasWait('ZAdjust')"
          class="pa-0"
          color="secondary">
          <v-icon>mdi-arrow-collapse-down</v-icon>
        </v-btn>
      </v-col>
      <v-col class="py-0 px-3 flex-column justify-center d-flex">
        <div class="grey--text text--darken-1">Offset Z</div>
        <div>{{ ZHomingOrigin }}mm</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="px-0 pb-0">
        <v-btn-toggle mandatory dense v-model="moveDistance">
          <v-btn :min-width="52" color="secondary" value="0.01">0.01</v-btn>
          <v-btn :min-width="52" class="pa-0" color="secondary" value="0.05">0.05</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>
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
      return origin.toFixed(2)
    } else {
      return null
    }
  }
}
</script>

<style type="scss" scoped>
</style>
