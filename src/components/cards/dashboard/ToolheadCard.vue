<template>
  <collapsable-card
    title="Tool"
    icon="$printer3dNozzle"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    menu-breakpoint="lg"
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
      <btn
        @click="sendGcode('M84')"
        :elevation="2"
        :disabled="hasWaits || !klippyConnected || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          MOTORS OFF
      </btn>
      <btn
        v-if="printerSupportsBedScrews"
        @click="sendGcode('BED_SCREWS_ADJUST', waits.onBedScrewsAdjust)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsAdjust)"
        :disabled="hasWaits || !klippyConnected || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          Bed_Screws_Adjust
      </btn>
      <btn
        v-if="printerSupportsBedScrewsCalculate"
        @click="sendGcode('SCREWS_TILT_CALCULATE', waits.onBedScrewsCalculate)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsCalculate)"
        :disabled="!allHomed || hasWaits || !klippyConnected || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          Screws_Tilt_Calculate
      </btn>
      <btn
        v-if="printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :elevation="2"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyConnected || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          Z_Tilt_Adjust
      </btn>
      <btn
        v-if="printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :elevation="2"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits || !klippyConnected || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          QGL
      </btn>
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

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
