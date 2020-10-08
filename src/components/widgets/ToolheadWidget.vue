<template>
  <v-container fluid class="py-0">
    <v-row>
      <v-col cols="auto">
        <!--  Toolhead Moves and Offset Z -->
        <toolhead-moves-widget v-if="!printerPrinting"></toolhead-moves-widget>
        <z-height-adjust-widget v-if="printerPrinting"></z-height-adjust-widget>
      </v-col>

      <v-col class="d-flex flex-column">
        <!-- Extruder Moves, Tooldhead Position and Part Cooling -->
        <v-container fluid class="pa-0">
          <extruder-moves-widget v-if="!printerPrinting"></extruder-moves-widget>
          <toolhead-position-widget></toolhead-position-widget>
          <fans-widget></fans-widget>
        </v-container>
      </v-col>
    </v-row>

    <v-row>
      <v-col class="py-0">
        <!-- Speed and Flow Adjustments  -->
        <speed-and-flow-adjust-widget></speed-and-flow-adjust-widget>
      </v-col>
    </v-row>
  </v-container>
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
