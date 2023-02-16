<template>
  <collapsable-card
    :title="$t('app.general.title.tool')"
    icon="$printer3dNozzle"
    draggable
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
          v-if="isManualProbeActive"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="manualProbeDialogOpen = true"
        >
          {{ $t('app.tool.tooltip.manual_probe') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsForceMove"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          :color="forceMove ? 'error' : undefined"
          @click="toggleForceMove"
        >
          {{ $t('app.tool.tooltip.force_move') }}
        </app-btn>
        <app-btn
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('M84')"
        >
          {{ $t('app.tool.tooltip.motors_off') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsBedScrews"
          :loading="hasWait($waits.onBedScrewsAdjust)"
          :disabled="!allHomed || !klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="bedScrewsAdjust"
        >
          {{ $t('app.tool.tooltip.bed_screws_adjust') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsBedScrewsCalculate"
          :loading="hasWait($waits.onBedScrewsCalculate)"
          :disabled="!allHomed || !klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('SCREWS_TILT_CALCULATE', $waits.onBedScrewsCalculate)"
        >
          {{ $t('app.tool.tooltip.screws_tilt_calculate') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsZtilt"
          :loading="hasWait($waits.onZTilt)"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('Z_TILT_ADJUST', $waits.onZTilt)"
        >
          {{ $t('app.tool.tooltip.z_tilt_adjust') }}
        </app-btn>
        <app-btn
          v-if="printerSupportsQgl"
          :loading="hasWait($waits.onQGL)"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ml-1"
          @click="sendGcode('QUAD_GANTRY_LEVEL', $waits.onQGL)"
        >
          {{ $t('app.tool.tooltip.quad_gantry_level') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <toolhead />

    <manual-probe-dialog
      v-if="manualProbeDialogOpen"
      v-model="manualProbeDialogOpen"
    />

    <bed-screws-adjust-dialog
      v-if="bedScrewsAdjustDialogOpen"
      v-model="bedScrewsAdjustDialogOpen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import Toolhead from './Toolhead.vue'

@Component({
  components: {
    Toolhead
  }
})
export default class ToolheadCard extends Mixins(StateMixin, ToolheadMixin) {
  manualProbeDialogOpen = false
  bedScrewsAdjustDialogOpen = false

  @Prop({ type: Boolean, default: false })
  readonly menuCollapsed!: boolean

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

  get printerSupportsForceMove () {
    return (
      (this.printerSettings.force_move?.enable_force_move ?? false) &&
      !this.printerIsDelta
    )
  }

  get printerIsDelta () {
    return ['delta', 'rotary_delta'].includes(this.printerSettings.printer.kinematics)
  }

  get showManualProbeDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showManualProbeDialogAutomatically
  }

  get showBedScrewsAdjustDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showBedScrewsAdjustDialogAutomatically
  }

  get forceMove () {
    return this.$store.state.config.uiSettings.toolhead.forceMove
  }

  @Watch('isManualProbeActive')
  onIsManualProbeActive (value: boolean) {
    if (value && this.showManualProbeDialogAutomatically &&
      this.klippyReady && !this.printerPrinting) {
      this.manualProbeDialogOpen = true
    }
  }

  @Watch('isBedScrewsAdjustActive')
  onIsBedScrewsAdjustActive (value: boolean) {
    if (value && this.showBedScrewsAdjustDialogAutomatically &&
      this.klippyReady && !this.printerPrinting) {
      this.bedScrewsAdjustDialogOpen = true
    }
  }

  bedScrewsAdjust () {
    if (this.isBedScrewsAdjustActive) {
      this.bedScrewsAdjustDialogOpen = true
    } else {
      this.sendGcode('BED_SCREWS_ADJUST', this.$waits.onBedScrewsAdjust)
    }
  }

  async toggleForceMove () {
    if (!this.forceMove && this.$store.state.config.uiSettings.general.forceMoveToggleWarning) {
      const result = await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_forcemove_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
      )

      if (!result) {
        return
      }
    }

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.toolhead.forceMove',
      value: !this.forceMove,
      server: false
    })
  }
}
</script>
