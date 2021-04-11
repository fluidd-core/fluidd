<template>
  <collapsable-card
    :title="$t('app.general.title.tool')"
    icon="$printer3dNozzle"
    :draggable="true"
    layout-path="dashboard.toolhead-card"
    menu-breakpoint="lg">

    <template v-slot:title>
      <v-icon left>$printer3dNozzle</v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.tool') }}</span>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            v-bind="attrs"
            v-on="on"
            v-show="!extrudeRetractReady"
            class="ml-3"
            color="info">
            $snowflakeAlert
          </v-icon>
        </template>
        <span v-html="$t('app.tool.tooltip.extruder_disabled', { min: minExtrudeTemp })"></span>
      </v-tooltip>
    </template>

    <template v-slot:menu>
      <app-btn
        @click="sendGcode('M84')"
        :elevation="2"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1">
          MOTORS OFF
      </app-btn>
      <app-btn
        v-if="printerSupportsBedScrews"
        @click="sendGcode('BED_SCREWS_ADJUST', waits.onBedScrewsAdjust)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsAdjust)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1">
          Bed_Screws_Adjust
      </app-btn>
      <app-btn
        v-if="printerSupportsBedScrewsCalculate"
        @click="sendGcode('SCREWS_TILT_CALCULATE', waits.onBedScrewsCalculate)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsCalculate)"
        :disabled="!allHomed || hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1">
          Screws_Tilt_Calculate
      </app-btn>
      <app-btn
        v-if="printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :elevation="2"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1">
          Z_Tilt_Adjust
      </app-btn>
      <app-btn
        v-if="printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :elevation="2"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1">
          QGL
      </app-btn>
    </template>

    <toolhead></toolhead>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import Toolhead from '@/components/widgets/toolhead/Toolhead.vue'

@Component({
  components: {
    Toolhead
  }
})
export default class ToolheadCard extends Mixins(StateMixin, ToolheadMixin) {
  get printerSettings () {
    return this.$store.getters['printer/getPrinterSettings']()
  }

  get printerSupportsQgl (): boolean {
    return 'quad_gantry_level' in this.printerSettings
  }

  get printerSupportsZtilt (): boolean {
    return 'z_tilt' in this.printerSettings
  }

  get printerSupportsBedScrews (): boolean {
    return 'bed_screws' in this.printerSettings
  }

  get printerSupportsBedScrewsCalculate (): boolean {
    return 'screws_tilt_adjust' in this.printerSettings
  }
}
</script>
