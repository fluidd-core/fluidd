<template>
  <v-card outlined>
    <v-textarea
      ref="textarea"
      v-model="metric.collector"
      class="px-4"
      :label="$t('app.setting.label.collector')"
      spellcheck="false"
      auto-grow
      hide-details="auto"
    >
      <template #append>
        <app-btn
          icon
          small
          color="secondary"
          :title="$t('app.general.tooltip.browse_metrics')"
          @click="browserOpen = true"
        >
          <v-icon>
            $magnify
          </v-icon>
        </app-btn>

        <app-btn
          icon
          small
          color="primary"
          :title="$t('app.general.tooltip.run_collector')"
          @click="runCollector"
        >
          <v-icon>
            $play
          </v-icon>
        </app-btn>
      </template>
    </v-textarea>

    <app-setting :title="$t('app.setting.label.last_result')">
      <v-text-field
        ref="result"
        filled
        dense
        single-line
        hide-details="auto"
        disabled
        :suffix="unit"
        :value="result"
      />
    </app-setting>

    <app-dialog
      v-if="browserOpen"
      v-model="browserOpen"
      :title="$t('app.general.title.metrics_explorer')"
      max-width="1200"
      no-actions
    >
      <v-card-text>
        <state-explorer
          @input="handleExplorerClick"
        />
      </v-card-text>
    </app-dialog>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import type { Metric } from '@/store/diagnostics/types'
import sandboxedEval from '@/plugins/sandboxedEval'
import StateExplorer from '@/components/widgets/diagnostics/StateExplorer.vue'
import type { VTextArea } from '@/types'

@Component({
  components: {
    StateExplorer
  }
})
export default class MetricsCollectorConfig extends Vue {
  @Prop({ type: Object, required: true })
  readonly metric!: Metric

  @Prop({ type: String, required: true })
  readonly unit!: string

  @Ref('textarea')
  readonly textArea!: VTextArea

  result = '-'
  browserOpen = false

  runCollector () {
    let data: string | number
    try {
      data = sandboxedEval(`
        const printer = ${JSON.stringify(this.$store.state.printer.printer)}
        return JSON.stringify(eval(${JSON.stringify(this.metric.collector)}))
      `)

      if (typeof data !== 'string') throw new Error('Metrics collector returned invalid data')

      data = JSON.parse(data) as string | number

      if (typeof data === 'number') {
        data = Math.round(data * 1000) / 1000
      }
    } catch (err) {
      data = (err instanceof Error && err.message) || 'Unknown Error'
    }

    this.result = data.toString()
  }

  handleExplorerClick (path: string) {
    this.browserOpen = false
    const element = this.textArea.$el.querySelector('textarea')
    if (element) {
      const selectionStart = element.selectionStart
      const selectionEnd = element.selectionEnd

      this.metric.collector =
      this.metric.collector.substring(0, selectionStart) +
      path +
      this.metric.collector.substring(selectionEnd)
    }
  }
}
</script>
