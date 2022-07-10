<template>
  <collapsable-card
    :title="$t('app.general.title.tool')"
    icon="$printer3dNozzle"
    :draggable="true"
    layout-path="dashboard.toolhead-card"
    menu-breakpoint="lg"
  >
    <template #title>
      <v-icon left>
        $printer3dNozzle
      </v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.tool') }}</span>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-icon
            v-show="!extruderReady"
            v-bind="attrs"
            class="ml-3"
            color="info"
            v-on="on"
          >
            $snowflakeAlert
          </v-icon>
        </template>
        <span v-html="$t('app.tool.tooltip.extruder_disabled', { min: activeExtruder.min_extrude_temp })" />
      </v-tooltip>
    </template>

    <template #menu>
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          :elevation="2"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('M84')"
        >
          {{ $t('app.tool.tooltip.motors_off') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsBedScrews"
          :elevation="2"
          :loading="hasWait(waits.onBedScrewsAdjust)"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('BED_SCREWS_ADJUST', waits.onBedScrewsAdjust)"
        >
          {{ $t('app.tool.tooltip.bed_screws_adjust') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsBedScrewsCalculate"
          :elevation="2"
          :loading="hasWait(waits.onBedScrewsCalculate)"
          :disabled="!allHomed || !klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('SCREWS_TILT_CALCULATE', waits.onBedScrewsCalculate)"
        >
          {{ $t('app.tool.tooltip.screws_tilt_calculate') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsZtilt"
          :elevation="2"
          :loading="hasWait(waits.onZTilt)"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        >
          {{ $t('app.tool.tooltip.z_tilt_adjust') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsQgl"
          :elevation="2"
          :loading="hasWait(waits.onQGL)"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        >
          {{ $t('app.tool.tooltip.quad_gantry_level') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <toolhead />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import Toolhead from '@/components/widgets/toolhead/Toolhead.vue'

@Component({
  components: {
    Toolhead
  }
})
export default class ToolheadCard extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean, default: false })
  public menuCollapsed!: boolean

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
