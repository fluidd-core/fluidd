<template>
  <v-container>
    <v-row>
      <v-col cols="auto" class="pt-0">
        <!--  Toolhead Moves and Offset Z -->
        <toolhead-moves-widget v-if="!printerPrinting"></toolhead-moves-widget>
        <z-height-adjust-widget v-if="printerPrinting"></z-height-adjust-widget>
      </v-col>

      <v-col class="pt-0">
        <!-- Extruder Moves, Tooldhead Position-->
        <!-- <v-container fluid class="pa-0"> -->
          <extruder-moves-widget v-if="!printerPrinting"></extruder-moves-widget>
          <toolhead-position-widget></toolhead-position-widget>
        <!-- </v-container> -->
      </v-col>
    </v-row>

    <v-row>
      <v-col class="pt-0">
        <!-- Part cooling -->
        <fans-widget></fans-widget>
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
