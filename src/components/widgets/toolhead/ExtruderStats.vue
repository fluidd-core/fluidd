<template>
  <div>
    <v-divider />
    <v-expansion-panels
      accordion
      multiple
      flat
    >
      <v-expansion-panel>
        <v-expansion-panel-header>
          <template #default="{ open }">
            <v-row no-gutters>
              <v-col
                class="text--secondary text-center"
                :class="{ 'text--disabled': !klippyReady }"
              >
                <v-fade-transition>
                  <span v-if="!open">~ {{ estimatedExtrudedLength }} mm @ {{ estimatedVolumetricFlow }} mm³/s, {{ estimatedMaxSpeed }} mm/s</span>
                </v-fade-transition>
              </v-col>
            </v-row>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <div
            class="text-center"
            :class="{ 'text--disabled': !klippyReady }"
          >
            <p
              v-html="$t('app.tool.label.stats_active_extruder', {
                filamentDiameter,
                nozzleDiameter
              })"
            />
            <p
              v-html="$t('app.tool.label.stats_volumetric_flow', {
                extrudeSpeed,
                estimatedVolumetricFlow
              })"
            />
            <p
              v-html="$t('app.tool.label.stats_extruded_length', {
                extrudeLength,
                extrudeFactor: (extrudeFactor * 100).toFixed(),
                estimatedExtrudedLength
              })"
            />
            <p
              v-html="$t('app.tool.label.stats_max_speed', {
                layerHeight,
                estimatedMaxSpeed
              })"
            />
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-divider />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class ExtruderMoves extends Mixins(StateMixin, ToolheadMixin) {
  get maxExtrudeLength (): number {
    return this.activeExtruder?.max_extrude_only_distance || 50
  }

  get filamentDiameter (): number {
    return this.activeExtruder?.filament_diameter || 1.75
  }

  get nozzleDiameter (): number {
    return this.activeExtruder?.nozzle_diameter || 0.4
  }

  get extrudeFactor (): number {
    return this.$store.state.printer.printer.gcode_move.extrude_factor || 1
  }

  get layerHeight (): number {
    return 0.2
  }

  get extrudeLength (): number {
    const extrudeLength = this.$store.state.config.uiSettings.toolhead.extrudeLength

    if (isNaN(+extrudeLength)) return 0

    return extrudeLength === -1
      ? this.$store.state.config.uiSettings.general.defaultExtrudeLength
      : extrudeLength
  }

  get extrudeSpeed (): number {
    const extrudeSpeed = this.$store.state.config.uiSettings.toolhead.extrudeSpeed

    if (isNaN(+extrudeSpeed)) return 0

    return extrudeSpeed === -1
      ? this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
      : extrudeSpeed
  }

  get estimatedExtrudedLength (): number {
    return Math.round(this.extrudeLength * this.extrudeFactor * (this.filamentDiameter / this.nozzleDiameter) * 10) / 10
  }

  get estimatedVolumetricFlow (): number {
    return Math.round(Math.PI * ((this.filamentDiameter / 2) ** 2) * this.extrudeSpeed * 10) / 10
  }

  get estimatedMaxSpeed (): number {
    return Math.round(this.estimatedVolumetricFlow / this.nozzleDiameter / this.layerHeight * 10) / 10
  }
}
</script>

<style type="scss" scoped>
:deep(.v-expansion-panel-header) {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
