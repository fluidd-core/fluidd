<template>
  <collapsable-card
    :title="$t('app.general.title.stats')"
    icon="$chart"
  >
    <template #menu>
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          small
          class="ms-1 my-1"
          @click="handleResetStats"
        >
          <v-icon
            small
            left
          >
            $delete
          </v-icon>
          <span>{{ $t('app.general.btn.reset_stats') }}</span>
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <v-card-text>
      <!-- <div class="mb-4">
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
      </div> -->

      <v-row v-if="supportsHistoryComponent">
        <v-col cols="3">
          <v-card
            outlined
            class="px-2 py-1 text-center stat-square"
          >
            <div class="secondary--text">
              {{ $t('app.general.label.total_jobs') }}
            </div>
            <div class="focus--text">
              {{ rollup.total_jobs }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.longest_job') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterTime(rollup.longest_job) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card
            outlined
            class="px-2 py-1 text-center stat-square"
          >
            <div class="secondary--text">
              {{ $t('app.general.label.total_time') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterTime(rollup.total_time) }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.total_time_avg') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterTime(rollup.total_avg) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card
            outlined
            class="px-2 py-1 text-center stat-square"
          >
            <div class="secondary--text">
              {{ $t('app.general.label.total_print_time') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterTime(rollup.total_print_time) }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.total_print_time_avg') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterTime(rollup.print_avg) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card
            outlined
            class="px-2 py-1 text-center stat-square"
          >
            <div class="secondary--text">
              {{ $t('app.general.label.total_filament') }}
            </div>
            <div class="focus--text">
              {{ $filters.getReadableLengthString(rollup.total_filament_used) }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.total_filament_avg') }}
            </div>
            <div class="focus--text">
              {{ $filters.getReadableLengthString(rollup.filament_avg) }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import JobHistory from '@/components/widgets/history/JobHistory.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    JobHistory
  }
})
export default class PrinterStatsCard extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly menuCollapsed!: boolean

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

  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
  }

  handleResetStats () {
    this.$confirm(
      this.$tc('app.history.msg.confirm_stats'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          SocketActions.serverHistoryResetTotals()
        }
      })
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
