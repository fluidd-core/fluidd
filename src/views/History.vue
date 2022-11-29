<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <printer-stats-card class="mb-2 mb-sm-4" />
      <printer-history-card />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import PrinterStatsCard from '@/components/widgets/stats/PrinterStatsCard.vue'
import PrinterHistoryCard from '@/components/widgets/history/PrintHistoryCard.vue'

@Component({
  components: {
    FileSystem,
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
