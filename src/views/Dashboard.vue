<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0">
        <klippy-disconnected-card v-if="!klippyConnected"></klippy-disconnected-card>
        <status-card v-if="klippyConnected"></status-card>
        <camera-card v-if="cameraEnabled"></camera-card>
        <toolhead-card></toolhead-card>
        <printer-limits-card></printer-limits-card>
      </v-col>
      <v-col cols="12" md="6" class="pt-0">
        <tools-card></tools-card>
        <console-card></console-card>
        <!-- <temperature-targets-card></temperature-targets-card> -->
        <temperature-graph-card></temperature-graph-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StatusCard from '@/components/cards/dashboard/StatusCard.vue'
import ToolsCard from '@/components/cards/dashboard/ToolsCard.vue'
import ToolheadCard from '@/components/cards/dashboard/ToolheadCard.vue'
import TemperatureTargetsCard from '@/components/cards/dashboard/TemperatureTargetsCard.vue'
import TemperatureGraphCard from '@/components/cards/dashboard/TemperatureGraphCard.vue'
import CameraCard from '@/components/cards/dashboard/CameraCard.vue'
import ConsoleCard from '@/components/cards/dashboard/ConsoleCard.vue'
import PrinterLimitsCard from '@/components/cards/dashboard/PrinterLimitsCard.vue'
import KlippyDisconnectedCard from '@/components/cards/KlippyDisconnectedCard.vue'
import { MetaInfo } from 'vue-meta'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    StatusCard,
    ToolsCard,
    ToolheadCard,
    TemperatureTargetsCard,
    TemperatureGraphCard,
    CameraCard,
    PrinterLimitsCard,
    KlippyDisconnectedCard,
    ConsoleCard
  },
  metaInfo (this: Dashboard): MetaInfo {
    return {
      title: 'Dashboard'
    }
  }
})
export default class Dashboard extends Mixins(UtilsMixin) {
  get cameraEnabled (): boolean {
    return this.$store.state.config.fileConfig.camera.enabled
  }
}
</script>
