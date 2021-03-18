<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0">
        <collapsable-card
          title="Configuration Files"
          icon="$files"
          :draggable="false"
        >
          <file-system
            :roots="['config', 'config_examples']"
            :height="408">
          </file-system>
        </collapsable-card>
      </v-col>
      <v-col cols="12" md="6" class="pt-0">
        <klippy-card v-if="!klippyReady || hasWarnings"></klippy-card>
        <printer-stats-card v-if="klippyReady"></printer-stats-card>
        <logs-card v-if="klippyReady"></logs-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-0">
        <printer-history-card v-if="klippyReady"></printer-history-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import EndStopsCard from '@/components/cards/configuration/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/cards/configuration/RunoutSensorsCard.vue'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import KlippyCard from '@/components/cards/KlippyCard.vue'
import BedMeshCard from '@/components/cards/configuration/BedMeshCard.vue'
import BedAdjustCard from '@/components/cards/configuration/BedAdjustCard.vue'
import LogsCard from '@/components/cards/configuration/LogsCard.vue'
import PrinterStatsCard from '@/components/cards/configuration/PrinterStatsCard.vue'
import PrinterHistoryCard from '@/components/cards/configuration/PrintHistoryCard.vue'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshCard,
    BedMeshWidget,
    BedAdjustCard,
    EndStopsCard,
    RunoutSensorsCard,
    FileSystem,
    KlippyCard,
    LogsCard,
    PrinterStatsCard,
    PrinterHistoryCard
  }
})
export default class Configure extends Mixins(StateMixin) {
  get supportsBedMesh () {
    return this.$store.getters['printer/getSupportsBedMesh']
  }

  get supportsRunoutSensors () {
    return this.$store.getters['printer/getRunoutSensors'].length
  }

  get supportsEndstops () {
    const endStops = this.$store.getters['printer/getEndstops']
    return (Object.keys(endStops).length > 0)
  }
}
</script>
