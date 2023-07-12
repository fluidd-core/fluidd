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
        <span v-html="$t('app.tool.tooltip.extruder_disabled', { min: activeExtruder?.min_extrude_temp })" />
      </v-tooltip>
    </template>

    <template #menu>
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          v-if="isManualProbeActive"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ms-1 my-1"
          @click="manualProbeDialogOpen = true"
        >
          {{ $t('app.tool.tooltip.manual_probe') }}
        </app-btn>

        <app-btn
          v-if="isBedScrewsAdjustActive"
          :disabled="!klippyReady || printerPrinting || !allHomed"
          small
          class="ms-1 my-1"
          @click="bedScrewsAdjustDialogOpen = true"
        >
          BED_SCREWS_ADJUST
        </app-btn>

        <app-btn
          v-if="printerSupportsForceMove"
          :disabled="!klippyReady || printerPrinting"
          small
          class="ms-1 my-1"
          :color="forceMove ? 'error' : undefined"
          @click="toggleForceMove"
        >
          FORCE_MOVE
        </app-btn>

        <app-btn
          :disabled="!klippyReady || printerPrinting"
          small
          class="ms-1 my-1"
          @click="sendGcode('M84')"
        >
          {{ $t('app.tool.tooltip.motors_off') }}
        </app-btn>

        <v-menu
          v-if="availableTools.length"
          left
          offset-y
          transition="slide-y-transition"
        >
          <template #activator="{ on, attrs, value }">
            <app-btn
              v-bind="attrs"
              small
              class="ms-1 my-1"
              :disabled="!klippyReady || printerPrinting"
              v-on="on"
            >
              <v-icon
                small
                class="mr-1"
              >
                $tools
              </v-icon>
              {{ $t('app.tool.tooltip.tools') }}
              <v-icon
                small
                class="ml-1"
                :class="{ 'rotate-180': value }"
              >
                $chevronDown
              </v-icon>
            </app-btn>
          </template>
          <v-list dense>
            <template v-for="(tool, index) of availableTools">
              <v-list-item
                v-if="tool.name !== '-'"
                :key="tool.name"
                :disabled="tool.disabled || (tool.wait && hasWait(tool.wait))"
                @click="tool.callback ? tool.callback() : sendGcode(tool.name, tool.wait)"
              >
                <v-list-item-icon>
                  <v-icon>
                    {{ tool.icon || '$tools' }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ tool.label || tool.name }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-divider
                v-else
                :key="`sep=${index}`"
              />
            </template>
          </v-list>
        </v-menu>
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
import { Macro } from '@/store/macros/types'

type Tool = {
  name: string,
  label?: string,
  disabled?: boolean,
  wait?: string,
  icon?: string,
  callback?: () => void,
}

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

  get printerSupportsQuadGantryLevel (): boolean {
    return 'quad_gantry_level' in this.printerSettings
  }

  get printerSupportsZTiltAdjust (): boolean {
    return 'z_tilt' in this.printerSettings
  }

  get printerSupportsBedScrewsAdjust (): boolean {
    return 'bed_screws' in this.printerSettings
  }

  get printerSupportsBedScrewsCalculate (): boolean {
    return 'screws_tilt_adjust' in this.printerSettings
  }

  get printerSupportsBedTiltCalibrate (): boolean {
    return 'bed_tilt' in this.printerSettings
  }

  get printerSupportsDeltaCalibrate (): boolean {
    return 'delta_calibrate' in this.printerSettings
  }

  get printerSupportsProbeCalibrate (): boolean {
    return 'probe' in this.printerSettings || 'bltouch' in this.printerSettings
  }

  get printerSupportsZEndstopCalibrate (): boolean {
    return (
      'stepper_z' in this.printerSettings &&
      'z_position_endstop' in this.printerSettings.stepper_z
    )
  }

  get serverSupportsSpoolman (): boolean {
    return this.$store.getters['spoolman/getSupported']
  }

  get macros (): Macro[] {
    return this.$store.getters['macros/getMacros'] as Macro[]
  }

  get loadFilamentMacro (): Macro | undefined {
    const [loadFilamentMacro] = this.macros
      .filter(macro => ['load_filament', 'm701'].includes(macro.name))
      .sort(macro => macro.name === 'load_filament' ? -1 : 1)

    return loadFilamentMacro
  }

  get unloadFilamentMacro (): Macro | undefined {
    const [unloadFilamentMacro] = this.macros
      .filter(macro => ['unload_filament', 'm702'].includes(macro.name))
      .sort(macro => macro.name === 'unload_filament' ? -1 : 1)

    return unloadFilamentMacro
  }

  get availableTools () {
    const tools: Tool[] = []
    const loadFilamentMacro = this.loadFilamentMacro

    if (loadFilamentMacro) {
      const ignoreMinExtrudeTemp = loadFilamentMacro.variables?.ignore_min_extrude_temp ?? false
      tools.push({
        name: loadFilamentMacro.name.toUpperCase(),
        label: loadFilamentMacro.name === 'm701' ? 'M701 (Load Filament)' : undefined,
        icon: '$loadFilament',
        disabled: !(ignoreMinExtrudeTemp || this.extruderReady)
      })
    }
    const unloadFilamentMacro = this.unloadFilamentMacro

    if (unloadFilamentMacro) {
      const ignoreMinExtrudeTemp = unloadFilamentMacro.variables?.ignore_min_extrude_temp ?? false
      tools.push({
        name: unloadFilamentMacro.name.toUpperCase(),
        label: unloadFilamentMacro.name === 'm702' ? 'M702 (Unload Filament)' : undefined,
        icon: '$unloadFilament',
        disabled: !(ignoreMinExtrudeTemp || this.extruderReady)
      })
    }

    if (this.serverSupportsSpoolman) {
      tools.push({
        name: 'CHANGE_SPOOL',
        label: this.$tc('app.spoolman.label.change_spool'),
        icon: '$changeFilament',
        callback: () => this.$store.commit('spoolman/setDialogState', { show: true })
      })
    }

    if (tools.length > 0) {
      tools.push({
        name: '-'
      })
    }

    if (this.printerSupportsBedScrewsAdjust) {
      tools.push({
        name: 'BED_SCREWS_ADJUST',
        disabled: !this.allHomed || this.isBedScrewsAdjustActive,
        wait: this.$waits.onBedScrewsAdjust
      })
    }

    if (this.printerSupportsBedTiltCalibrate) {
      tools.push({
        name: 'BED_TILT_CALIBRATE',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onBedTiltCalibrate
      })
    }

    if (this.printerSupportsDeltaCalibrate) {
      tools.push({
        name: 'DELTA_CALIBRATE',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onDeltaCalibrate
      })
    }

    tools.push({
      name: 'MANUAL_PROBE',
      disabled: !this.allHomed || this.isManualProbeActive,
      wait: this.$waits.onManualProbe
    })

    if (this.printerSupportsProbeCalibrate) {
      tools.push({
        name: 'PROBE_CALIBRATE',
        disabled: !this.allHomed,
        wait: this.$waits.onProbeCalibrate
      })
    }

    if (this.printerSupportsBedScrewsCalculate) {
      tools.push({
        name: 'SCREWS_TILT_CALCULATE',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onBedScrewsCalculate
      })
    }

    if (this.printerSupportsQuadGantryLevel) {
      tools.push({
        name: 'QUAD_GANTRY_LEVEL',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onQGL
      })
    }

    if (this.printerSupportsZEndstopCalibrate) {
      tools.push({
        name: 'Z_ENDSTOP_CALIBRATE',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onZEndstopCalibrate
      })
    }

    if (this.printerSupportsZTiltAdjust) {
      tools.push({
        name: 'Z_TILT_ADJUST',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onZTilt
      })
    }

    return tools
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
