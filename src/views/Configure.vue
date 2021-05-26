<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">

    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0" v-if="!klippyReady || hasWarnings">
        <klippy-status-card></klippy-status-card>
      </v-col>
      <v-col cols="12" md="3" lg="3" class="pt-0" v-if="klippyReady && !hasWarnings">
        <disk-usage-card>
        </disk-usage-card>
        <collapsable-card
          :title="$t('app.general.title.system_control')"
          icon="$cogs">
          <v-card-text>
            <system-control></system-control>
          </v-card-text>
        </collapsable-card>
      </v-col>
      <v-col class="pt-0">
        <collapsable-card
          :title="$t('app.general.title.config_files')"
          icon="$files"
          :draggable="false"
        >
          <file-system
            :roots="['config', 'config_examples', 'docs', 'logs']"
            name="configure"
            :max-height="620">
          </file-system>
        </collapsable-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import SystemControl from '@/components/common/SystemControl.vue'
import DiskUsageCard from '@/components/widgets/stats/DiskUsageCard.vue'

@Component({
  components: {
    FileSystem,
    SystemControl,
    DiskUsageCard
  }
})
export default class Configure extends Mixins(StateMixin) {
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
