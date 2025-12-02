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
import type { VTextarea } from 'vuetify/lib'

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
  readonly textArea!: VTextarea

  result = '-'
  browserOpen = false

  async runCollector () {
    try {
      const data = await sandboxedEval(`
        const printer = ${JSON.stringify(this.$typedState.printer.printer)}
        return eval(${JSON.stringify(this.metric.collector)})
      `)

      this.result = String(
        typeof data === 'number'
          ? Math.round(data * 1000) / 1000
          : data
      )
    } catch (e) {
      this.result = String(e || 'Unknown Error')
    }
  }

  handleExplorerClick (path: string) {
    this.browserOpen = false
    const element = this.textArea.$refs.input
    if (element) {
      const selectionStart = element.selectionStart
      const selectionEnd = element.selectionEnd

      this.metric.collector = (
        this.metric.collector.substring(0, selectionStart) +
        path +
        this.metric.collector.substring(selectionEnd)
      )
    }
  }
}
</script>
