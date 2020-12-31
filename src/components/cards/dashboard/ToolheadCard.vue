<template>
  <collapsable-card
    :hide-menu="(printerPrinting)"
    title="Tool"
    icon="$printer3dNozzle"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

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
            color="cyan">
            $snowflakeAlert
          </v-icon>
        </template>
        <span>extruder disabled, below min_extrude_temp ({{ minExtrudeTemp }}<small>°C</small>)</span>
      </v-tooltip>
    </template>

    <template v-slot:menu>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('M84')"
        :elevation="2"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          MOTORS OFF
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsBedScrews"
        @click="sendGcode('BED_SCREWS_ADJUST', waits.onBedScrewsAdjust)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsAdjust)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          Bed_Screws_Adjust
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsBedScrewsCalculate"
        @click="sendGcode('SCREWS_TILT_CALCULATE', waits.onBedScrewsCalculate)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsCalculate)"
        :disabled="!allHomed || hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          Screws_Tilt_Calculate
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :elevation="2"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyConnected"
        small
        class="ma-1"
        color="secondary">
          Z_Tilt_Adjust
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :elevation="2"
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
        :elevation="2"
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
        :elevation="2"
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
        :elevation="2"
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import ToolheadWidget from '@/components/widgets/ToolheadWidget.vue'

@Component({
  components: {
    ToolheadWidget
  }
})
export default class ToolheadCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

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
      ? parseInt(this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp)
      : 170 // Default to a sane value
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
