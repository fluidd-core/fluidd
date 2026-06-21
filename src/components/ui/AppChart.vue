<template>
  <div
    class="chart"
    :style="{
      height: $filters.getPixelsString(height)
    }"
  >
    <e-chart
      ref="chart"
      style="overflow: initial;"
      manual-update
      :init-options="initOptions"
      autoresize
      @hook:mounted="applyOption"
    />
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import type { DatasetComponentOption, ECharts, EChartsInitOpts, EChartsOption } from 'echarts'

@Component({})
export default class AppChart extends Vue {
  @Prop({ type: Array, required: true })
  readonly data!: Extract<DatasetComponentOption['source'], unknown[]>

  @Prop({ type: Array })
  readonly dimensions?: DatasetComponentOption['dimensions']

  @Prop({ type: Object, default: () => {} })
  readonly options!: EChartsOption

  @Prop({ type: String, default: '100%' })
  readonly height!: string

  @Ref('chart')
  readonly chart?: ECharts

  // Stable reference so re-renders don't make vue-echarts re-init the chart.
  readonly initOptions: EChartsInitOpts = Object.freeze({ renderer: 'canvas' })

  // Apply the full options + current data (on chart ready and on option changes).
  applyOption () {
    if (!this.chart) return

    const options: EChartsOption = {
      ...this.options,
      grid: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...this.options.grid
      },
      dataset: {
        dimensions: this.dimensions,
        source: this.data
      }
    }

    this.chart.setOption(options, { notMerge: true })
  }

  @Watch('options')
  onOptions () {
    this.applyOption()
  }

  // Push only a dataset update, never a full options re-apply.
  @Watch('data')
  onData (data?: Extract<DatasetComponentOption['source'], unknown[]>) {
    if (
      this.chart != null &&
      Array.isArray(data)
    ) {
      this.chart.setOption({
        dataset: {
          dimensions: this.dimensions,
          source: data
        }
      })
    }
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    this.chart?.dispose()
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    width: 100%;
  }
</style>
