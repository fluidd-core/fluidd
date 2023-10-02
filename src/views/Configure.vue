<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="6"
    >
      <collapsable-card
        :title="$t('app.general.title.config_files')"
        icon="$codeJson"
      >
        <file-system
          :roots="['config']"
          max-height="816"
          name="configure"
          bulk-actions
        />
      </collapsable-card>
    </v-col>
    <v-col
      cols="12"
      md="6"
    >
      <collapsable-card
        :title="$t('app.general.title.other_files')"
        icon="$files"
      >
        <file-system
          :roots="roots"
          max-height="816"
          name="configure"
        />
      </collapsable-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'

import SystemOverviewCard from '@/components/widgets/system/SystemOverviewCard.vue'
import SystemUsageCard from '@/components/widgets/system/SystemUsageCard.vue'
import DiskUsageCard from '@/components/widgets/system/DiskUsageCard.vue'

@Component({
  components: {
    FileSystem,
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

  get roots () {
    const roots = ['logs', 'docs', 'config_examples']
    const excludeRoots = ['gcodes', 'config', 'timelapse', 'timelapse_frames']

    for (const root of this.$store.state.server.info.registered_directories || []) {
      if (!excludeRoots.includes(root) && !roots.includes(root)) {
        roots.push(root)
      }
    }

    return roots
  }
}
</script>
