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
          {{ step }} <small>{{ config.axes[index].unit }}</small>
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
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <app-setting :title="$t('app.setting.label.name')">
                <v-text-field
                  v-model="metric.name"
                  filled
                  dense
                  single-line
                  hide-details="auto"
                  :rules="[rules.required]"
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

              <app-setting :title="$t('app.setting.label.icon')">
                <v-select
                  filled
                  dense
                  single-line
                  hide-details="auto"
                  :items="lineStyles"
                  :value="metric.style.lineStyle"
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

              <app-slider
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
      </template>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { DiagnosticsCardConfig, Metric } from '@/store/diagnostics/types'
import AppSetting from '@/components/ui/AppSetting.vue'
import MetricsCollectorConfig from './MetricsCollectorConfig.vue'

@Component({
  components: { AppSetting, MetricsCollectorConfig }
})
export default class MetricsConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  public config!: DiagnosticsCardConfig

  currentStep = 1
  steps = [this.$t('app.general.label.left_y'), this.$t('app.general.label.right_y')]

  lineStyles = [
    { text: this.$t('app.setting.label.solid'), value: 'solid' },
    { text: this.$t('app.setting.label.dotted'), value: 'dotted' },
    { text: this.$t('app.setting.label.dashed'), value: 'dashed' }
  ]

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required')
  }

  collectorResults: {[axis: number]: {[metric: number]: string}} = {}

  handleColorChange (prop: 'lineColor' | 'fillColor', metric: Metric, event: any) {
    metric.style[prop] = event.color.hexString
  }
}
</script>
