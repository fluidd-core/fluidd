<template>
  <v-expansion-panels
    accordion
    multiple
    flat
  >
    <v-expansion-panel>
      <v-expansion-panel-header>
        <template #actions>
          <v-icon
            small
            class="my-1 mr-2"
          >
            $expand
          </v-icon>
        </template>
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
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class ExtruderMoves extends Mixins(StateMixin, ToolheadMixin) {
  get extrudeFactor (): number {
    return this.$typedState.printer.printer.gcode_move.extrude_factor || 1
  }

  get layerHeight (): number {
    return 0.2
  }

  get extrudeLength (): number {
    const extrudeLength = this.$typedState.config.uiSettings.toolhead.extrudeLength

    if (isNaN(+extrudeLength)) return 0

    return extrudeLength === -1
      ? this.$typedState.config.uiSettings.general.defaultExtrudeLength
      : extrudeLength
  }

  get extrudeSpeed (): number {
    const extrudeSpeed = this.$typedState.config.uiSettings.toolhead.extrudeSpeed

    if (isNaN(+extrudeSpeed)) return 0

    return extrudeSpeed === -1
      ? this.$typedState.config.uiSettings.general.defaultExtrudeSpeed
      : extrudeSpeed
  }

  get estimatedExtrudedLength (): number {
    return Math.round(this.extrudeLength * this.extrudeFactor * (this.filamentDiameter ** 2 / this.nozzleDiameter ** 2) * 10) / 10
  }

  get estimatedVolumetricFlow (): number {
    return Math.round(Math.PI / 4 * this.filamentDiameter ** 2 * this.extrudeSpeed * 10) / 10
  }

  get estimatedMaxSpeed (): number {
    const stadiumArea = this.layerHeight * (this.nozzleDiameter + this.layerHeight * (Math.PI / 4 - 1))
    return Math.round(this.estimatedVolumetricFlow / stadiumArea * 10) / 10
  }
}
</script>
