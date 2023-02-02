<template>
  <div>
    <v-card-text>
      <v-row
        justify="space-between"
        align="start"
      >
        <v-col class="controls-wrapper">
          <extruder-selection v-if="multipleExtruders" />
          <toolhead-moves v-if="!printerPrinting" />
          <z-height-adjust v-if="printerPrinting" />
        </v-col>

        <v-col class="controls-wrapper">
          <toolhead-position />
          <extruder-moves v-if="!printerPrinting" />
          <z-height-adjust v-if="!printerPrinting" />
        </v-col>
      </v-row>
    </v-card-text>

    <template v-if="!printerPrinting">
      <v-divider />

      <extruder-stats />

      <v-divider />
    </template>

    <v-card-text>
      <speed-and-flow-adjust />
      <pressure-advance-adjust v-if="showPressureAdvance" />
    </v-card-text>

    <v-expansion-panels
      accordion
      multiple
      flat
    >
      <v-expansion-panel
        v-for="extruderStepper in extruderSteppers"
        :key="`extruderStepper-${extruderStepper.name}`"
      >
        <v-divider />
        <v-expansion-panel-header>
          <template #actions>
            <v-icon
              small
              class="my-1 mr-2"
            >
              $expand
            </v-icon>
          </template>
          {{ $filters.startCase(extruderStepper.name) }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <pressure-advance-adjust
            :extruder-stepper="extruderStepper"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMoves from '@/components/widgets/toolhead/ToolheadMoves.vue'
import ExtruderMoves from '@/components/widgets/toolhead/ExtruderMoves.vue'
import ExtruderSelection from '@/components/widgets/toolhead/ExtruderSelection.vue'
import ToolheadPosition from '@/components/widgets/toolhead/ToolheadPosition.vue'
import ZHeightAdjust from '@/components/widgets/toolhead/ZHeightAdjust.vue'
import SpeedAndFlowAdjust from '@/components/widgets/toolhead/SpeedAndFlowAdjust.vue'
import PressureAdvanceAdjust from '@/components/widgets/toolhead/PressureAdvanceAdjust.vue'
import ExtruderStats from '@/components/widgets/toolhead/ExtruderStats.vue'
import { ExtruderStepper } from '@/store/printer/types'

@Component({
  components: {
    ToolheadMoves,
    ExtruderMoves,
    ExtruderSelection,
    ToolheadPosition,
    ZHeightAdjust,
    SpeedAndFlowAdjust,
    PressureAdvanceAdjust,
    ExtruderStats
  }
})
export default class Toolhead extends Mixins(StateMixin) {
  get multipleExtruders () {
    return this.$store.getters['printer/getExtruders'].length > 1
  }

  get extruderSteppers () {
    const extruderSteppers = this.$store.getters['printer/getExtruderSteppers'] as ExtruderStepper[]
    return extruderSteppers
      .filter(x => x.pressure_advance !== undefined)
  }

  get showPressureAdvance () {
    const extruder = this.$store.getters['printer/getActiveExtruder']
    return extruder?.pressure_advance !== undefined
  }
}
</script>

<style type="scss" scoped>
  .controls-wrapper {
    min-width: 380px !important;
    max-width: 450px !important;
  }
</style>
