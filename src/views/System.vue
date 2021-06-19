<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">

    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0">
        <system-overview-card></system-overview-card>
        <disk-usage-card></disk-usage-card>
      </v-col>

      <v-col cols="12" md="6" class="pt-0">
        <klippy-status-card v-if="!klippyReady || hasWarnings"></klippy-status-card>
        <system-usage-card v-if="hasGraphData"></system-usage-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import SystemControl from '@/components/common/SystemControl.vue'

import SystemOverviewCard from '@/components/widgets/system/SystemOverviewCard.vue'
import SystemUsageCard from '@/components/widgets/system/SystemUsageCard.vue'
import DiskUsageCard from '@/components/widgets/system/DiskUsageCard.vue'

@Component({
  components: {
    FileSystem,
    SystemControl,
    SystemOverviewCard,
    SystemUsageCard,
    DiskUsageCard
  }
})
export default class Configure extends Mixins(StateMixin) {
  get hasGraphData () {
    return (
      this.$store.state.charts.klipper !== undefined ||
      this.$store.state.charts.moonraker !== undefined ||
      this.$store.state.charts.memory !== undefined
    )
  }

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
