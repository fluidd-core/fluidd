<template>
  <div>
    <div
      class="chart"
      :style="{ 'height': height }"
    >
      <e-chart
        v-if="ready"
        ref="chart"
        style="overflow: initial;"
        :option="opts"
        :update-options="updateOptions"
        :init-options="initOptions"
        autoresize
      />
    </div>
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import type { ECharts } from 'echarts'
import { merge } from 'lodash-es'

@Component({})
export default class AppChart extends Vue {
  @Prop({ type: Array, required: true })
  readonly data!: unknown[]

  @Prop({ type: Array })
  readonly dimensions?: unknown[]

  @Prop({ type: Object, default: () => {} })
  readonly options!: Record<string, unknown>

  @Prop({ type: String, default: '100%' })
  readonly height!: string

  @Ref('chart')
  readonly chart!: ECharts

  // Stable references so component re-renders don't make vue-echarts dispose/
  // re-init the chart or re-apply the options, both of which would wipe the
  // imperatively-set dataset and blank the chart.
  readonly updateOptions = Object.freeze({ notMerge: true })
  readonly initOptions = Object.freeze({ renderer: 'canvas' })

  ready = false

  @Watch('data')
  onData (data?: unknown[]) {
    if (this.chart && data && data.length) {
      this.chart.setOption({
        dataset: {
          dimensions: this.dimensions,
          source: data
        }
      })
    }
  }

  get opts () {
    const baseOptions = {
      grid: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }
    }

    const options = merge(baseOptions, this.options)
    return options
  }

  mounted () {
    if (this.data && !this.ready) this.ready = true
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    if (this.chart) {
      this.chart.dispose()
    }
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    width: 100%;
  }
</style>
