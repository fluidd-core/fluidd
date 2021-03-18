<template>
  <collapsable-card
    :title="$t('printer.tool.title')"
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
        <span v-html="$t('printer.tool.tooltip',{ minExtrudeTemp, degree: $t('app.degree.celsius') })"></span>
      </v-tooltip>
    </template>

    <template v-slot:menu>
      <btn
        @click="sendGcode('M84')"
        :elevation="2"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          {{$t('printer.tool.motorsOff')}}
      </btn>
      <btn
        v-if="printerSupportsBedScrews"
        @click="sendGcode('BED_SCREWS_ADJUST', waits.onBedScrewsAdjust)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsAdjust)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          {{$t('printer.tool.bedScrewAdjust')}}
      </btn>
      <btn
        v-if="printerSupportsBedScrewsCalculate"
        @click="sendGcode('SCREWS_TILT_CALCULATE', waits.onBedScrewsCalculate)"
        :elevation="2"
        :loading="hasWait(waits.onBedScrewsCalculate)"
        :disabled="!allHomed || hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          {{$t('printer.tool.screwsTiltCalculate')}}
      </btn>
      <btn
        v-if="printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :elevation="2"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          {{$t('printer.tool.zTiltAdjust')}}
      </btn>
      <btn
        v-if="printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :elevation="2"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits || !klippyReady || printerPrinting"
        small
        class="ma-1"
        color="secondary">
          {{$t('printer.tool.qgl')}}
      </btn>
    </template>

    <toolhead-widget></toolhead-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import ToolheadWidget from '@/components/widgets/ToolheadWidget.vue'

@Component({
  components: {
    ToolheadWidget
  }
})
export default class ToolheadCard extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

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

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
