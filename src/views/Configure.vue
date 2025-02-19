<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="6"
    >
      <collapsable-card
        :title="$t('app.general.title.config_files')"
        icon="$codeJson"
        :help-tooltip="$t('app.general.tooltip.file_browser_help')"
        class="mb-2 mb-md-4"
      >
        <file-system
          :roots="['config']"
          name="configure"
          bulk-actions
          class="full-screen"
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
        :help-tooltip="$t('app.general.tooltip.file_browser_configuration_help')"
        class="mb-2 mb-md-4"
      >
        <file-system
          :roots="roots"
          name="configure"
          class="full-screen"
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

  get roots () {
    const roots = ['logs', 'docs', 'config_examples']
    const excludeRoots = ['gcodes', 'config', 'timelapse', 'timelapse_frames']

    const registeredDirectories: string[] = this.$store.state.server.info.registered_directories || []

    for (const root of registeredDirectories) {
      if (!excludeRoots.includes(root) && !roots.includes(root)) {
        roots.push(root)
      }
    }

    return roots
  }
}
</script>

<style lang="scss" scoped>
  .full-screen {
    max-height: calc(100vh - 190px);
    max-height: calc(100svh - 190px);
  }
</style>
