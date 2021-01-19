<template>
  <collapsable-card
    :title="$t('Printer Stats')"
    icon="$chart">

    <v-card-text>
      <div class="mb-4">
        <v-layout justify-space-between>
          <div class="grey--text text--darken-2">{{ $t('Disk Usage') }}</div>
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
            </span> {{ $t('used') }}
          </div>
          <div class="grey--text">
            <span class="focus--text">
              {{ $filters.getReadableFileSizeString(fileSystemUsage.free) }}
            </span> {{ $t('free') }}
          </div>
        </v-layout>
      </div>

      <v-row v-if="supportsHistoryPlugin">
        <v-col cols="3">
          <v-card outlined class="px-2 py-1 text-center stat-square">
            <div class="grey--text text--darken-2">{{ $t('Total Print Jobs') }}</div>
            <div class="grey--text focus--text">{{ rollup.total_jobs }}</div>
            <div class="grey--text text--darken-2">{{ $t('Longest Job') }}</div>
            <div class="grey--text focus--text">{{ $filters.formatCounterTime(rollup.longest_duration) }}</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card outlined class="px-2 py-1 text-center stat-square">
            <div class="grey--text text--darken-2">{{ $t('Total time') }}</div>
            <div class="grey--text focus--text">{{ $filters.formatCounterTime(rollup.total_duration) }}</div>
            <div class="grey--text text--darken-2">{{ $t('Avg Per Print') }}</div>
            <div class="grey--text focus--text">{{ $filters.formatCounterTime(rollup.total_duration_avg) }}</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card outlined class="px-2 py-1 text-center stat-square">
            <div class="grey--text text--darken-2">{{ $t('Total print time') }}</div>
            <div class="grey--text focus--text">{{ $filters.formatCounterTime(rollup.print_duration) }}</div>
            <div class="grey--text text--darken-2">{{ $t('Avg Per Print') }}</div>
            <div class="grey--text focus--text">{{ $filters.formatCounterTime(rollup.print_duration_avg) }}</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card outlined class="px-2 py-1 text-center stat-square">
            <div class="grey--text text--darken-2">{{ $t('Total filament Used') }}</div>
            <div class="grey--text focus--text">{{ $filters.getReadableLengthString(rollup.filament_used) }}</div>
            <div class="grey--text text--darken-2">{{ $t('Avg Per Print') }}</div>
            <div class="grey--text focus--text">{{ $filters.getReadableLengthString(rollup.filament_used_avg) }}</div>
          </v-card>
        </v-col>
      </v-row>
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
  get rollup () {
    return this.$store.getters['history/getRollUp']
  }

  get fileSystemUsedPercent () {
    // (250 / 500) * 100
    const total = this.fileSystemUsage.total
    const used = this.fileSystemUsage.used
    return Math.floor((used / total) * 100).toFixed()
  }

  get fileSystemUsage () {
    return this.$store.getters['files/getUsage']
  }

  get appInfo () {
    return {
      fluidd: this.$store.state.version.fluidd,
      moonraker: this.$store.state.version.components.moonraker || {},
      klipper: this.$store.state.version.components.klipper || {}
    }
  }

  get supportsHistoryPlugin () {
    return this.$store.getters['server/pluginSupport']('history')
  }
}
</script>

<style lang="scss" scoped>
  .total-size {
    font-size: 0.875rem;
  }

  .stat-square {
    min-height: 110px;

    div:nth-child(2) {
      margin-bottom: 6px;
    }
  }
</style>
