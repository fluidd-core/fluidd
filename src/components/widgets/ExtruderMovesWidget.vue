<template>
  <v-form v-model="valid">
    <v-row justify="end">
      <v-col cols="6" class="text-right">
        <v-text-field
          ref="lengthfield"
          v-model.number="extrudeLength"
          :disabled="!klippyConnected"
          :rules="[rules.min, rules.maxLength]"
          @focus="$event.target.select()"
          hide-details
          outlined
          dense
          label="Extrude Length"
          suffix="mm">
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-btn
          @click="sendRetractGcode(extrudeLength, extrudeSpeed, waits.onExtract)"
          :disabled="hasWaits || !extrudeRetractReady || !klippyConnected || !valid"
          :elevation="2"
          block
          color="secondary"
          class="mr-2">
          Retract
          <v-icon>$chevronUp</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row justify="end" class="mt-0">
      <v-col cols="6" class="text-right">
        <v-text-field
          v-model.number="extrudeSpeed"
          :disabled="!klippyConnected"
          :rules="[rules.min, rules.maxSpeed]"
          @focus="$event.target.select()"
          hide-details
          outlined
          dense
          label="Extrude Speed"
          suffix="mm/s">
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-btn
          @click="sendExtrudeGcode(extrudeLength, extrudeSpeed, waits.onExtrude)"
          :disabled="hasWaits || !extrudeRetractReady || !klippyConnected || !valid"
          :elevation="2"
          block
          color="secondary"
          class="mr-2">
          Extrude
          <v-icon>$chevronDown</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
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
  valid = true

  rules = {
    min: (v: number) => {
      return (v >= 1) || 'Min 1'
    },
    maxSpeed: (v: number) => {
      return (v <= this.maxExtrudeSpeed) || 'Max ' + this.maxExtrudeSpeed
    },
    maxLength: (v: number) => {
      return (v <= this.maxExtrudeLength) || 'Max ' + this.maxExtrudeLength
    }
  }

  get maxExtrudeSpeed () {
    return this.$store.getters['socket/getPrinterSettings']('extruder.max_extrude_only_velocity')
  }

  get maxExtrudeLength () {
    return this.$store.getters['socket/getPrinterSettings']('extruder.max_extrude_only_distance')
  }

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

  sendRetractGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const gcode = `M83
        G1 E-${amount} F${rate * 60}`
      this.sendGcode(gcode, wait)
    }
  }

  sendExtrudeGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const gcode = `M83
        G1 E${amount} F${rate * 60}`
      this.sendGcode(gcode, wait)
    }
  }
}
</script>
