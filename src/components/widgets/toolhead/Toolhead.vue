<template>
  <v-card-text>
    <v-row justify="space-between" align="start" class="mb-2">
      <v-col cols="auto">
        <extruder-selection v-if="multipleExtruders"></extruder-selection>
        <toolhead-moves v-if="!printerPrinting"></toolhead-moves>
        <z-height-adjust v-if="printerPrinting"></z-height-adjust>
      </v-col>

      <v-col style="min-width: 280px; max-width: 420px;">
        <toolhead-position></toolhead-position>
        <extruder-moves v-if="!printerPrinting"></extruder-moves>
        <z-height-adjust v-if="!printerPrinting"></z-height-adjust>
      </v-col>
    </v-row>

    <!-- Speed and Flow Adjustments  -->
    <speed-and-flow-adjust></speed-and-flow-adjust>
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

@Component({
  components: {
    ToolheadMoves,
    ExtruderMoves,
    ExtruderSelection,
    ToolheadPosition,
    ZHeightAdjust,
    SpeedAndFlowAdjust
  }
})
export default class Toolhead extends Mixins(StateMixin) {
  get multipleExtruders () {
    return this.$store.getters['printer/getExtruders'].length > 1
  }
}
</script>
