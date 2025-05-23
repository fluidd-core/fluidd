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
            v-show="hasExtruder && !extruderReady"
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
      <app-btn-collapse-group :collapsed="narrow">
        <app-btn
          v-if="isManualProbeActive"
          :disabled="!klippyReady || printerPrinting"
          small
          class="me-1 my-1"
          @click="manualProbeDialogOpen = true"
        >
          {{ $t('app.tool.tooltip.manual_probe') }}
        </app-btn>

        <app-btn
          v-if="isBedScrewsAdjustActive"
          :disabled="!klippyReady || printerPrinting || !allHomed"
          small
          class="me-1 my-1"
          @click="bedScrewsAdjustDialogOpen = true"
        >
          BED_SCREWS_ADJUST
        </app-btn>

        <app-btn
          v-if="printerSupportsForceMove"
          :disabled="!klippyReady || printerPrinting"
          small
          class="me-1 my-1"
          :color="forceMoveEnabled ? 'error' : undefined"
          @click="toggleForceMove"
        >
          FORCE_MOVE
        </app-btn>

        <app-btn
          v-if="hasSteppersEnabled"
          :disabled="!klippyReady || printerPrinting"
          small
          class="me-1 my-1"
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
              class="me-1 my-1"
              :disabled="!klippyReady || printerPrinting"
              v-on="on"
            >
              <v-icon
                small
                class="me-1"
              >
                $tools
              </v-icon>
              {{ $t('app.tool.tooltip.tools') }}
              <v-icon
                small
                class="ms-1"
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
                @click="sendGcode(tool.name, tool.wait)"
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
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import Toolhead from './Toolhead.vue'
import type { Macro } from '@/store/macros/types'
import type { KlipperPrinterSettings, KlippyApp } from '@/store/printer/types'

type Tool = {
  name: string,
  label?: string,
  disabled?: boolean,
  wait?: string,
  icon?: string,
}

@Component({
  components: {
    Toolhead
  }
})
export default class ToolheadCard extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean })
  readonly narrow?: boolean

  get klippyApp (): KlippyApp {
    return this.$typedGetters['printer/getKlippyApp']
  }

  get printerSettings (): KlipperPrinterSettings {
    return this.$typedGetters['printer/getPrinterSettings']
  }

  get printerSupportsQuadGantryLevel (): boolean {
    return this.printerSettings.quad_gantry_level != null
  }

  get printerSupportsZTiltAdjust (): boolean {
    return (
      this.printerSettings.z_tilt != null ||
      (
        this.klippyApp.isKalico &&
        this.printerSettings.z_tilt_ng != null
      )
    )
  }

  get printerSupportsBedScrewsAdjust (): boolean {
    return this.printerSettings.bed_screws != null
  }

  get printerSupportsBedScrewsCalculate (): boolean {
    return this.printerSettings.screws_tilt_adjust != null
  }

  get printerSupportsBedTiltCalibrate (): boolean {
    return this.printerSettings.bed_tilt != null
  }

  get printerSupportsDeltaCalibrate (): boolean {
    return this.printerSettings.delta_calibrate != null
  }

  get printerSupportsProbeCalibrate (): boolean {
    return (
      this.printerSettings.probe != null ||
      this.printerSettings.bltouch != null ||
      this.printerSettings.smart_effector != null ||
      Object.keys(this.printerSettings)
        .some(x => x.startsWith('probe_eddy_current '))
    )
  }

  get printerSupportsZEndstopCalibrate (): boolean {
    return (
      this.printerSettings.stepper_z?.position_endstop != null
    )
  }

  get loadFilamentMacro (): Macro | undefined {
    return this.$typedGetters['macros/getMacroByName'](
      'LOAD_FILAMENT',
      'FILAMENT_LOAD',
      'M701'
    )
  }

  get unloadFilamentMacro (): Macro | undefined {
    return this.$typedGetters['macros/getMacroByName'](
      'UNLOAD_FILAMENT',
      'FILAMENT_UNLOAD',
      'M702'
    )
  }

  get cleanNozzleMacro (): Macro | undefined {
    return this.$typedGetters['macros/getMacroByName'](
      'CLEAN_NOZZLE',
      'NOZZLE_CLEAN',
      'WIPE_NOZZLE',
      'NOZZLE_WIPE',
      'G12'
    )
  }

  get availableTools () {
    const tools: Tool[] = []

    const loadFilamentMacro = this.loadFilamentMacro

    if (loadFilamentMacro) {
      const ignoreMinExtrudeTemp = loadFilamentMacro.variables?.ignore_min_extrude_temp ?? false

      tools.push({
        name: loadFilamentMacro.name.toUpperCase(),
        label: loadFilamentMacro.name.toLowerCase() === 'm701' ? 'M701 (Load Filament)' : undefined,
        icon: '$loadFilament',
        disabled: !(ignoreMinExtrudeTemp || this.extruderReady)
      })
    }

    const unloadFilamentMacro = this.unloadFilamentMacro

    if (unloadFilamentMacro) {
      const ignoreMinExtrudeTemp = unloadFilamentMacro.variables?.ignore_min_extrude_temp ?? false

      tools.push({
        name: unloadFilamentMacro.name.toUpperCase(),
        label: unloadFilamentMacro.name.toLowerCase() === 'm702' ? 'M702 (Unload Filament)' : undefined,
        icon: '$unloadFilament',
        disabled: !(ignoreMinExtrudeTemp || this.extruderReady)
      })
    }

    const cleanNozzleMacro = this.cleanNozzleMacro

    if (cleanNozzleMacro) {
      tools.push({
        name: cleanNozzleMacro.name.toUpperCase(),
        label: cleanNozzleMacro.name.toLowerCase() === 'g12' ? 'G12 (Clean the Nozzle)' : undefined,
        icon: '$cleanNozzle'
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
        name: 'PROBE_ACCURACY',
        disabled: !this.allHomed,
        wait: this.$waits.onProbeAccuracy
      })
      tools.push({
        name: 'PROBE_CALIBRATE',
        disabled: !this.allHomed,
        wait: this.$waits.onProbeCalibrate
      })
    }

    if (this.printerSupportsQuadGantryLevel) {
      tools.push({
        name: 'QUAD_GANTRY_LEVEL',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onQGL
      })
    }

    if (this.printerSupportsBedScrewsCalculate) {
      tools.push({
        name: 'SCREWS_TILT_CALCULATE',
        disabled: !this.allHomed || this.isManualProbeActive,
        wait: this.$waits.onBedScrewsCalculate
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

  get printerSupportsForceMove (): boolean {
    return (
      (this.printerSettings.force_move?.enable_force_move ?? false) &&
      !this.hasRoundBed
    )
  }

  get hasSteppersEnabled (): boolean {
    return this.$typedGetters['printer/getHasSteppersEnabled']
  }

  get hasRoundBed (): boolean {
    return this.$typedGetters['printer/getHasRoundBed']
  }

  async toggleForceMove () {
    const result = (
      this.forceMoveEnabled ||
      !this.$typedState.config.uiSettings.general.forceMoveToggleWarning ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_forcemove_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
      )
    )

    if (result) {
      this.$typedDispatch('printer/forceMoveEnabled', !this.forceMoveEnabled)
    }
  }
}
</script>
