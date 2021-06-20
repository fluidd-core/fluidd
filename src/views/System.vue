<template>
  <v-row>
    <v-col cols="12" md="6">
      <system-overview-card class="mb-4"></system-overview-card>
      <disk-usage-card></disk-usage-card>
    </v-col>

    <v-col cols="12" md="6" v-if="hasGraphData">
      <system-usage-card></system-usage-card>
    </v-col>
  </v-row>
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
