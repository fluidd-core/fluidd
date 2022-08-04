<template>
  <v-card outlined>
    <v-textarea
      v-model="metric.collector"
      class="px-4"
      :label="$t('app.settings.label.collector')"
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

    <app-setting :title="$t('app.general.tooltip.last_result')">
      <v-text-field
        ref="result"
        filled
        dense
        single-line
        hide-details="auto"
        disabled
        :suffix="unit"
      />
    </app-setting>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import { Metric } from '@/store/diagnostics/types'
import AppSetting from '@/components/ui/AppSetting.vue'
import sandboxedEval from '@/plugins/sandboxedEval'

@Component({
  components: { AppSetting }
})
export default class AxesConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  public metric!: Metric

  @Prop({ type: String, required: true })
  public unit!: string

  @Ref('result')
  readonly result!: any

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
    this.result.value = data
  }
}
</script>
