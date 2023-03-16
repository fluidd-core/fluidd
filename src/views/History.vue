<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <printer-stats-card class="mb-2 mb-sm-4" />
      <printer-history-card />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import PrinterStatsCard from '@/components/widgets/stats/PrinterStatsCard.vue'
import PrinterHistoryCard from '@/components/widgets/history/PrintHistoryCard.vue'

@Component({
  components: {
    PrinterStatsCard,
    PrinterHistoryCard
  }
})
export default class History extends Vue {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }
}
</script>
