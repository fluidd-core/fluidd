<template>
  <v-dialog
    :value="value"
    :max-width="750"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ $t('app.general.label.metrics') }}</span>
        <v-spacer />
        <app-btn
          small
          @click="handleAddMetric"
        >
          <v-icon>$plus</v-icon>
        </app-btn>
      </v-card-title>

      <v-card-text class="mt-4">
        <v-expansion-panels accordion>
          <v-expansion-panel
            v-for="(metric, metricIndex) in metrics"
            :key="metricIndex"
          >
            <v-expansion-panel-header>{{ metric.name }}</v-expansion-panel-header>
            <v-expansion-panel-content>
              {{ metric.key }}
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <app-btn
          color="warning"
          text
          @click="$emit('input', false)"
        >
          {{ $t('app.general.btn.cancel') }}
        </app-btn>
        <app-btn
          color="primary"
          @click="handleSave"
        >
          {{ $t('app.general.btn.save') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Metric } from '@/store/diagnostics/types'
import AppSetting from '@/components/ui/AppSetting.vue'
import AppBtn from '@/components/ui/AppBtn.vue'

@Component({
  components: { AppBtn, AppSetting }
})
export default class DiagnosticsCardConfigDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: Array, required: true })
  public metrics!: Metric[]

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required'),
    numAboveZero: (v: number) => v > 0 || this.$t('app.general.simple_form.error.min', { min: '> 0' })
  }

  handleAddMetric () {
    this.metrics.push({
      key: '',
      name: '',
      color: '',
      suffix: ''
    })
  }

  handleSave () {
    this.$emit('save', this.metrics)
    this.$emit('input', false)
  }
}
</script>
