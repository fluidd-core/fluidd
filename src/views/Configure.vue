<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="7" lg="5" class="pt-0">

        <klippy-status-card v-if="!klippyReady || hasWarnings"></klippy-status-card>
        <collapsable-card
          :title="$t('app.general.title.config_files')"
          icon="$files"
          :draggable="false"
        >
          <file-system
            :roots="['config', 'config_examples', 'docs']"
            :max-height="620">
          </file-system>
        </collapsable-card>

      </v-col>
      <v-col cols="12" md="5" lg="7" class="pt-0">

        <v-row>
          <v-col :cols="breakpoint">
            <printer-stats-card></printer-stats-card>
          </v-col>
          <v-col :cols="breakpoint" v-if="klippyReady">
            <collapsable-card
              :title="$t('app.general.title.system_control')"
              :collapsable="false"
              icon="$cogs">
              <v-card-text>
                <system-control></system-control>
              </v-card-text>
            </collapsable-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <v-row class="mt-0 mt-sm-2">
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
export default class Configure extends Mixins(StateMixin) {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }

  get supportsHistory () {
    return this.$store.getters['server/pluginSupport']('history')
  }
}
</script>
