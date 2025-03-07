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
              {{ $filters.formatCounterSeconds(rollup.longest_job) }}
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
              {{ $filters.formatCounterSeconds(rollup.total_time) }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.total_time_avg') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterSeconds(rollup.total_avg) }}
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
              {{ $filters.formatCounterSeconds(rollup.total_print_time) }}
            </div>
            <div class="secondary--text">
              {{ $t('app.general.label.total_print_time_avg') }}
            </div>
            <div class="focus--text">
              {{ $filters.formatCounterSeconds(rollup.print_avg) }}
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
import { SocketActions } from '@/api/socketActions'

@Component({})
export default class PrinterStatsCard extends Vue {
  @Prop({ type: Boolean })
  readonly menuCollapsed?: boolean

  get rollup () {
    return this.$store.getters['history/getRollUp']
  }

  get supportsHistoryComponent (): boolean {
    return this.$store.getters['server/componentSupport']('history')
  }

  async handleResetStats () {
    const result = await this.$confirm(
      this.$tc('app.history.msg.confirm_stats'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverHistoryResetTotals()
    }
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
