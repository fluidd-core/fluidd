<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" class="pt-0">
        <klippy-status-card v-if="!klippyReady || hasWarnings"></klippy-status-card>
        <printer-stats-card></printer-stats-card>
      </v-col>
      <v-col cols="12" v-if="supportsHistory && klippyReady" >
        <printer-history-card></printer-history-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import SystemControl from '@/components/common/SystemControl.vue'
import PrinterStatsCard from '@/components/widgets/stats/PrinterStatsCard.vue'
import PrinterHistoryCard from '@/components/widgets/history/PrintHistoryCard.vue'

@Component({
  components: {
    FileSystem,
    SystemControl,
    PrinterStatsCard,
    PrinterHistoryCard
  }
})
export default class History extends Mixins(StateMixin) {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
  }
}
</script>
