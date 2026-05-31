<template>
  <div>
    <v-expansion-panels
      accordion
      flat
    >
      <v-expansion-panel
        v-for="(metric, i) in config.metrics"
        :key="i"
      >
        <v-expansion-panel-header>
          {{ metric.name || $t('app.setting.label.new_metric') }}
          <v-divider class="ml-4" />
          <v-col
            cols="1"
            class="d-flex justify-center"
          >
            <app-btn
              icon
              small
              @click.stop="removeMetric(i)"
            >
              <v-icon dense>
                $delete
              </v-icon>
            </app-btn>
          </v-col>
        </v-expansion-panel-header>

        <v-expansion-panel-content>
          <app-setting :title="$t('app.setting.label.name')">
            <v-text-field
              v-model="metric.name"
              filled
              dense
              single-line
              hide-details="auto"
              :rules="[$rules.required]"
            />
          </app-setting>

          <v-divider />

          <metrics-collector-config
            class="mt-3"
            :metric="metric"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-divider class="mt-4" />

    <v-row class="pa-2 mt-2">
      <v-spacer />
      <app-btn
        small
        @click="addMetric"
      >
        <v-icon small>
          $plus
        </v-icon>
        {{ $t('app.setting.btn.add_metric') }}
      </app-btn>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { DiagnosticsWatchesConfig } from '@/store/diagnostics/types'
import MetricsCollectorConfig from './MetricsCollectorConfig.vue'
import { defaultDiagnosticsWatchesConfig } from '@/store/layout/state'

@Component({
  components: {
    MetricsCollectorConfig
  }
})
export default class WatchMetricsConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsWatchesConfig

  addMetric () {
    const defaultCard = defaultDiagnosticsWatchesConfig()
    const defaultMetric = defaultCard.metrics[0]

    this.config.metrics.push(defaultMetric)
  }

  removeMetric (index: number) {
    this.config.metrics.splice(index, 1)
  }
}
</script>
