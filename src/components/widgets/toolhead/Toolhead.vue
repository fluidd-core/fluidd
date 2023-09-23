<template>
  <div>
    <v-card-text>
      <tool-change-macros />

      <v-row
        justify="space-between"
        align="start"
      >
        <v-col class="controls-wrapper">
          <extruder-selection v-if="multipleExtruders" />
          <toolhead-control-cross v-if="!printerPrinting && toolheadControlStyle === 'cross'" />
          <toolhead-control-bars v-else-if="!printerPrinting && toolheadControlStyle === 'bars'" />
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

    <extruder-steppers />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadControlCross from './ToolheadControlCross.vue'
import ToolheadControlBars from './ToolheadControlBars.vue'
import ExtruderMoves from './ExtruderMoves.vue'
import ExtruderSelection from './ExtruderSelection.vue'
import ToolheadPosition from './ToolheadPosition.vue'
import ZHeightAdjust from './ZHeightAdjust.vue'
import SpeedAndFlowAdjust from './SpeedAndFlowAdjust.vue'
import PressureAdvanceAdjust from './PressureAdvanceAdjust.vue'
import ExtruderStats from './ExtruderStats.vue'
import ExtruderSteppers from './ExtruderSteppers.vue'
import ToolChangeMacros from './ToolChangeMacros.vue'
import { Extruder } from '@/store/printer/types'
import { ToolheadControlStyle } from '@/store/config/types'

@Component({
  components: {
    ToolheadControlCross,
    ToolheadControlBars,
    ExtruderMoves,
    ExtruderSelection,
    ToolheadPosition,
    ZHeightAdjust,
    SpeedAndFlowAdjust,
    PressureAdvanceAdjust,
    ExtruderStats,
    ExtruderSteppers,
    ToolChangeMacros
  }
})
export default class Toolhead extends Mixins(StateMixin) {
  get multipleExtruders (): boolean {
    return this.$store.getters['printer/getExtruders'].length > 1
  }

  get showPressureAdvance (): boolean {
    const extruder = this.$store.getters['printer/getActiveExtruder'] as Extruder | undefined
    return extruder?.pressure_advance !== undefined
  }

  get toolheadControlStyle (): ToolheadControlStyle {
    return this.$store.state.config.uiSettings.general.toolheadControlStyle as ToolheadControlStyle
  }
}
</script>

<style type="scss" scoped>
  .controls-wrapper {
    min-width: 380px !important;
    max-width: 450px !important;
  }
</style>
