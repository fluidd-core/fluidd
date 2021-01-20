<template>
  <v-card-text>
    <v-row justify="space-between" align="start" class="mb-2">
      <v-col cols="auto">
        <toolhead-moves-widget v-if="!printerPrinting"></toolhead-moves-widget>
        <z-height-adjust-widget v-if="printerPrinting"></z-height-adjust-widget>
      </v-col>

      <v-col style="min-width: 280px; max-width: 420px;">
        <toolhead-position-widget></toolhead-position-widget>
        <extruder-moves-widget v-if="!printerPrinting"></extruder-moves-widget>
        <z-height-adjust-widget v-if="!printerPrinting"></z-height-adjust-widget>
      </v-col>
    </v-row>

    <!-- Speed and Flow Adjustments  -->
    <speed-and-flow-adjust-widget></speed-and-flow-adjust-widget>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import ToolheadMovesWidget from '@/components/widgets/ToolheadMovesWidget.vue'
import ExtruderMovesWidget from '@/components/widgets/ExtruderMovesWidget.vue'
import ToolheadPositionWidget from '@/components/widgets/ToolheadPositionWidget.vue'
import ZHeightAdjustWidget from '@/components/widgets/ZHeightAdjustWidget.vue'
import SpeedAndFlowAdjustWidget from '@/components/widgets/SpeedAndFlowAdjustWidget.vue'
import FansWidget from '@/components/widgets/FansWidget.vue'

@Component({
  components: {
    ToolheadMovesWidget,
    ExtruderMovesWidget,
    ToolheadPositionWidget,
    ZHeightAdjustWidget,
    SpeedAndFlowAdjustWidget,
    FansWidget
  }
})
export default class ToolheadWidget extends Mixins(UtilsMixin) {}
</script>

<style type="scss" scoped>
</style>
