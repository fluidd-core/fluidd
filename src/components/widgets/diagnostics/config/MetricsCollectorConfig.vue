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

    <v-dialog
      v-if="browserOpen"
      :value="browserOpen"
      :max-width="1200"
      scrollable
      @input="browserOpen = false"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.general.title.metrics_explorer') }}</span>

          <v-spacer />
          <app-btn
            color=""
            icon
            @click="browserOpen = false"
          >
            <v-icon>$close</v-icon>
          </app-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <state-explorer
            @input="handleExplorerClick"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import { Metric } from '@/store/diagnostics/types'
import AppSetting from '@/components/ui/AppSetting.vue'
import sandboxedEval from '@/plugins/sandboxedEval'
import StateExplorer from '@/components/widgets/diagnostics/StateExplorer.vue'

@Component({
  components: { StateExplorer, AppSetting }
})
export default class MetricsCollectorConfig extends Vue {
  @Prop({ type: Object, required: true })
  public metric!: Metric

  @Prop({ type: String, required: true })
  public unit!: string

  @Ref('textarea')
  readonly textArea!: any

  result = '-'
  browserOpen = false

  runCollector () {
    let data
    try {
      data = sandboxedEval(`
        const printer = ${JSON.stringify(this.$store.state.printer.printer)}
        return JSON.stringify(eval(${JSON.stringify(this.metric.collector)}))
      `)

      if (typeof data !== 'string') throw new Error('Metrics collector returned invalid data')
      data = JSON.parse(data)
    } catch (err: any) {
      data = err?.message ?? 'Unknown Error'
    }

    if (typeof data === 'number') data = Math.round(data * 1000) / 1000
    this.result = data
  }

  handleExplorerClick (path: string) {
    this.browserOpen = false
    const element = this.textArea.$el.querySelector('textarea')
    const selectionStart = element.selectionStart
    const selectionEnd = element.selectionEnd

    this.metric.collector =
      this.metric.collector.substring(0, selectionStart) +
      path +
      this.metric.collector.substring(selectionEnd)
  }
}
</script>
