<template>
  <collapsable-card
    :hide-menu="(printerPrinting)"
    title="Tool"
    icon="$printer3dNozzle">

    <template v-slot:title>
      <v-icon left>$printer3dNozzle</v-icon>
      <span class="font-weight-light">Tool</span>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            v-bind="attrs"
            v-on="on"
            v-show="!extrudeRetractReady"
            class="ml-3"
            color="error">
            $fireAlert
          </v-icon>
        </template>
        <span>extruder disabled, min_extrude_temp below {{ minExtrudeTemp }}<small>°C</small></span>
      </v-tooltip>
    </template>

    <template v-slot:menu>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('M84')"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          MOTORS OFF
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          ZTA
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          QGL
      </v-btn>
      <v-divider class="my-2"></v-divider>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('G28', waits.onHomeAll)"
        :loading="hasWait(waits.onHomeAll)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        :color="(!allHomed) ? 'warning' : 'secondary'">
          <v-icon small class="mr-1">$home</v-icon> All
      </v-btn>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('G28 X', waits.onHomeX)"
        :loading="hasWait(waits.onHomeX)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        :color="(!allHomed) ? 'warning' : 'secondary'">
          <v-icon small class="mr-1">$home</v-icon> X
      </v-btn>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('G28 Y', waits.onHomeY)"
        :loading="hasWait(waits.onHomeY)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        :color="(!allHomed) ? 'warning' : 'secondary'">
          <v-icon small class="mr-1">$home</v-icon> Y
      </v-btn>
    </template>

    <toolhead-widget></toolhead-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import ToolheadWidget from '@/components/widgets/ToolheadWidget.vue'

@Component({
  components: {
    ToolheadWidget
  }
})
export default class ToolheadCard extends Mixins(UtilsMixin) {
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
