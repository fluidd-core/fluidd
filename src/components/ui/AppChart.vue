<template>
  <div>
    <div v-if="title" v-html="title"></div>
    <div class="chart" :style="{ 'height': height }">
      <ECharts
        style="overflow: initial;"
        ref="chart"
        :option="opts"
        :setOptionOps="{ notMerge: true }"
        :initOpts="{ renderer: 'svg' }"
        :events="events">
      </ECharts>
    </div>
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { ECharts } from 'echarts'
import { merge } from 'lodash-es'

@Component({})
export default class AppChart extends Vue {
  @Prop({ type: String, required: false })
  title!: string

  @Prop({ type: Array, required: true })
  data!: any

  @Prop({ type: Object, default: {} })
  options!: any

  @Prop({ type: String, default: '100%' })
  height!: string;

  events = []

  get chart () {
    const ref = this.$refs.chart as any
    if (ref) return ref.inst as ECharts
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get isDark () {
    return this.$store.state.config.uiSettings.theme.isDark
  }

  @Watch('data')
  onData (data: any) {
    if (this.chart) {
      this.chart.setOption({
        dataset: {
          source: data
        }
      })
    }
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    if (this.chart) {
      this.chart.dispose()
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
}

</script>

<style lang='scss' scoped>
  .chart {
    width: 100%;
  }
</style>
