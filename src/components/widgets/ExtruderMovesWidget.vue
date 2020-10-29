<template>
  <div>
    <v-row class="py-0 pb-2">
      <v-col cols="12" lg="6" class="py-0">
        <v-btn
          @click="sendRetractGcode(extrudeLength, extrudeSpeed, waits.onExtract)"
          :disabled="hasWaits || !extrudeRetractReady || !klippyConnected"
          block
          color="secondary"
          class="mb-2">
          Retract
          <v-icon>$chevronUp</v-icon>
        </v-btn>
        <v-btn
          @click="sendExtrudeGcode(extrudeLength, extrudeSpeed, waits.onExtrude)"
          :disabled="hasWaits || !extrudeRetractReady || !klippyConnected"
          block
          color="secondary"
          class="mb-2">
          Extrude
          <v-icon>$chevronDown</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="12" lg="6" class="py-0">
        <v-text-field
          v-model="extrudeLength"
          :disabled="!klippyConnected"
          @focus="$event.target.select()"
          solo
          dense
          hide-details
          label="Extrude Length"
          type="number"
          suffix="mm"
          class="mb-1">
        </v-text-field>
        <v-text-field
          v-model="extrudeSpeed"
          :disabled="!klippyConnected"
          @focus="$event.target.select()"
          solo
          dense
          hide-details
          label="Extrude Speed"
          suffix="mm/s"
          class="">
        </v-text-field>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BtnToolheadMove from '@/components/inputs/BtnToolheadMove.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({
  components: {
    BtnToolheadMove
  }
})
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

  /**
   * Ensures our temps are high enough to extrude or retract.
   */
  get extrudeRetractReady () {
    return (this.extruder && this.minExtrudeTemp)
      ? (this.extruder.temperature > this.minExtrudeTemp)
      : false
  }

  get extruder () {
    return this.$store.state.socket.printer.extruder
  }

  get minExtrudeTemp () {
    return (this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp)
      ? this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp
      : 170 // Default to a sane value
  }
}
</script>

<style type="scss" scoped>
</style>
