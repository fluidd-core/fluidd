<template>
  <collapsable-card
    :title="config.title"
    :icon="`$${config.icon}`"
    draggable
    :layout-path="`diagnostics.${config.id}`"
  >
    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          class="me-1 my-1"
          @click="$emit('edit', config)"
        >
          <v-icon
            small
            left
          >
            $edit
          </v-icon>
          {{ $t('app.general.title.edit_watch_panel') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <v-simple-table dense>
      <thead>
        <tr>
          <th>{{ $t('app.setting.label.name') }}</th>
          <th>{{ $t('app.setting.label.collector') }}</th>
          <th>{{ $t('app.setting.label.value') }}</th>
          <th>{{ $t('app.setting.label.type') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(metric, i) in config.metrics"
          :key="i"
        >
          <td>{{ metric.name }}</td>
          <td>
            <code
              class="text-truncate d-inline-block"
              style="max-width: 300px; vertical-align: middle;"
              :title="metric.collector"
            >{{ metric.collector }}</code>
          </td>
          <td><code>{{ formatValue(watchValues[metric.collector]) }}</code></td>
          <td><code>{{ valueType(watchValues[metric.collector]) }}</code></td>
        </tr>
        <tr v-if="config.metrics.length === 0">
          <td
            colspan="4"
            class="text-center text--disabled"
          >
            {{ $t('app.general.label.no_watch_metrics') }}
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { DiagnosticsWatchesConfig } from '@/store/diagnostics/types'

@Component({})
export default class DiagnosticsWatchCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsWatchesConfig

  get watchValues (): Record<string, unknown> {
    return this.$typedState.diagnostics.watchValues
  }

  formatValue (value: unknown): string {
    if (value === undefined || value === null) return '-'
    if (typeof value === 'number') return String(Math.round(value * 1000) / 1000)
    return String(value)
  }

  valueType (value: unknown): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return `array(${value.length})`
    return typeof value
  }
}
</script>
