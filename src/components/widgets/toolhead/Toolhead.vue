<template>
  <v-card-text>
    <v-row
      justify="space-between"
      align="start"
      class="mb-2"
    >
      <v-col class="controls-wrapper">
        <extruder-selection v-if="multipleExtruders" />
        <toolhead-moves
          v-if="!printerPrinting"
          :force-move="forceMove"
        />
        <z-height-adjust v-if="printerPrinting" />

        <!-- some css is missing here -->
        <v-checkbox
          v-if="printerSupportsForcemove"
          v-model="forceMove"
          :disabled="!klippyReady"
          color="error"
        >
          <template #label>
            <v-icon
              color="error"
            >
              $warning
            </v-icon>
            <span>&nbsp;{{ $t('app.tool.checkbox.force_move') }}</span>
          </template>
        </v-checkbox>
      </v-col>

      <v-col class="controls-wrapper">
        <toolhead-position :force-move="forceMove" />
        <extruder-moves v-if="!printerPrinting" />
        <z-height-adjust v-if="!printerPrinting" />
      </v-col>
    </v-row>

    <!-- Speed and Flow Adjustments  -->
    <speed-and-flow-adjust />
    <pressure-advance-adjust v-if="showPressureAdvance" />
  </v-card-text>
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

@Component({
  components: {
    ToolheadMoves,
    ExtruderMoves,
    ExtruderSelection,
    ToolheadPosition,
    ZHeightAdjust,
    SpeedAndFlowAdjust,
    PressureAdvanceAdjust
  }
})
export default class Toolhead extends Mixins(StateMixin) {
  forceMove = false

  get printerSupportsForcemove () {
    const printerSettings = this.$store.getters['printer/getPrinterSettings']()
    if (printerSettings.force_move.enable_force_move) {
      return true
    } else {
      return false
    }
  }

  get multipleExtruders () {
    return this.$store.getters['printer/getExtruders'].length > 1
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
