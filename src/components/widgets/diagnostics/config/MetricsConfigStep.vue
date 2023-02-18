<template>
  <v-stepper
    v-model="currentStep"
    non-linear
    flat
  >
    <v-stepper-header>
      <template v-for="(step, index) of steps">
        <v-stepper-step
          :key="`step-${index}`"
          :step="index + 1"
          editable
        >
          {{ step }}
          <small>{{ config.axes[index].unit }}</small>
        </v-stepper-step>

        <v-divider
          v-if="index < steps.length - 1"
          :key="index"
        />
      </template>
    </v-stepper-header>

    <v-stepper-content
      v-for="(step, i) of steps"
      :key="`${i}-content`"
      class="pt-4"
      :step="i + 1"
    >
      <template v-if="currentStep === i + 1">
        <v-expansion-panels
          accordion
          flat
        >
          <v-expansion-panel
            v-for="(metric, j) in config.axes[i].metrics"
            :key="`${j}-metric-${i}-axis`"
          >
            <v-expansion-panel-header>
              {{ metric.name }}
              <v-divider class="ml-4" />
              <v-col
                cols="1"
                class="d-flex justify-center"
              >
                <app-btn
                  small
                  icon
                  color=""
                  @click.stop="removeMetric(i, j)"
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
                  :rules="[
                    $rules.required
                  ]"
                />
              </app-setting>

              <v-divider />

              <app-setting :title="$t('app.setting.label.line_color')">
                <app-color-picker
                  :primary="metric.style.lineColor"
                  :title="metric.name"
                  dot
                  @change="handleColorChange('lineColor', metric, $event)"
                />
              </app-setting>

              <v-divider />

              <app-setting :title="$t('app.setting.label.line_style')">
                <v-select
                  v-model="metric.style.lineStyle"
                  filled
                  dense
                  single-line
                  hide-details="auto"
                  :items="lineStyles"
                />
              </app-setting>

              <v-divider />

              <app-setting :title="$t('app.setting.label.fill_color')">
                <app-color-picker
                  :primary="metric.style.fillColor ?? metric.style.lineColor"
                  :title="metric.name"
                  dot
                  @change="handleColorChange('fillColor', metric, $event)"
                />
              </app-setting>

              <v-divider />

              <app-named-slider
                v-model="metric.style.fillOpacity"
                class="px-4 py-3"
                :label="$t('app.setting.label.fill_opacity')"
                :min="0"
                :max="100"
                suffix="%"
              />

              <v-divider />

              <app-setting :title="$t('app.setting.label.show_legend')">
                <v-switch
                  v-model="metric.style.displayLegend"
                  hide-details
                />
              </app-setting>

              <v-divider />

              <metrics-collector-config
                class="mt-3"
                :metric="metric"
                :unit="config.axes[i].unit"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-divider class="mt-4" />

        <v-row class="pa-2 mt-2">
          <v-spacer />
          <app-btn
            small
            @click="addMetric(i)"
          >
            <v-icon small>
              $plus
            </v-icon>
            {{ $t('app.setting.btn.add_metric') }}
          </app-btn>
        </v-row>
      </template>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { DiagnosticsCardConfig, Metric } from '@/store/diagnostics/types'
import MetricsCollectorConfig from './MetricsCollectorConfig.vue'
import { defaultState } from '@/store/layout/state'

@Component({
  components: {
    MetricsCollectorConfig
  }
})
export default class MetricsConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  currentStep = 1
  steps = [this.$t('app.setting.label.left_y'), this.$t('app.setting.label.right_y')]

  lineStyles = [
    { text: this.$t('app.setting.label.solid'), value: 'solid' },
    { text: this.$t('app.setting.label.dotted'), value: 'dotted' },
    { text: this.$t('app.setting.label.dashed'), value: 'dashed' }
  ]

  handleColorChange (prop: 'lineColor' | 'fillColor', metric: Metric, event: any) {
    metric.style[prop] = event.color.hexString
  }

  addMetric (axis: number) {
    const defaultCard = defaultState().layouts.diagnostics.container1[0] as DiagnosticsCardConfig
    const defaultMetric = defaultCard.axes[0].metrics[0]

    this.config.axes[axis].metrics.push(defaultMetric)
  }

  removeMetric (axis: number, metric: number) {
    this.config.axes[axis].metrics.splice(metric, 1)
  }
}
</script>

<style lang="scss" scoped>
.v-stepper__header > .v-stepper__step {
  /*
   * Handling of <small> elements in the stepper header seems to be broken,
   * so we handle them ourselves.
  */
  padding-top: 22px;
  padding-bottom: 22px;
}
</style>
