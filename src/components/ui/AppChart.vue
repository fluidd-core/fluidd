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
        :update-options="{ notMerge: true }"
        :init-options="{ renderer: 'svg' }"
        :events="events"
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
  readonly data!: any

  @Prop({ type: Object, default: () => {} })
  readonly options!: any

  @Prop({ type: String, default: '100%' })
  readonly height!: string

  @Prop({ type: Array, default: () => [] })
  readonly events!: any

  @Ref('chart')
  readonly chart!: ECharts

  ready = false

  get isDark () {
    return this.$store.state.config.uiSettings.theme.isDark
  }

  @Watch('data')
  onData (data: any) {
    if (this.chart && data && data.length) {
      this.chart.setOption({
        dataset: {
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
