<template>
  <collapsable-card
    :title="$t('app.file_system.label.disk_usage')"
    icon="$chart">

    <v-card-text>
      <div class="mb-4">
        <v-layout justify-space-between>
          <div class="grey--text text--darken-2">{{ $t('app.file_system.label.disk_usage') }}</div>
        </v-layout>
        <v-progress-linear
          :size="90"
          :height="10"
          :value="fileSystemUsedPercent"
          color="primary"
          class="my-1"
        >
        </v-progress-linear>

        <v-layout justify-space-between>
          <div class="grey--text">
            <span class="focus--text">
              {{ $filters.getReadableFileSizeString(fileSystemUsage.used) }}
            </span> {{ $t('app.general.label.used') }}
          </div>
          <div class="grey--text">
            <span class="focus--text">
              {{ $filters.getReadableFileSizeString(fileSystemUsage.free) }}
            </span> {{ $t('app.general.label.free') }}
          </div>
        </v-layout>
      </div>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import JobHistory from '@/components/widgets/history/JobHistory.vue'

@Component({
  components: {
    JobHistory
  }
})
export default class PrinterStatsCard extends Vue {
  get fileSystemUsedPercent () {
    // (250 / 500) * 100
    const total = this.fileSystemUsage.total
    const used = this.fileSystemUsage.used
    return Math.floor((used / total) * 100).toFixed()
  }

  get fileSystemUsage () {
    return this.$store.getters['files/getUsage']
  }
}
</script>
