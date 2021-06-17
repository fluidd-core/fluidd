<template>
  <div>
    <div
      class="chart"
      :style="{ 'height': height }"
    >
      <ECharts
        v-if="ready"
        style="overflow: initial;"
        ref="chart"
        :option="opts"
        :setOptionOps="{ notMerge: true }"
        :initOpts="{ renderer: 'svg' }"
        :events="events"
      >
      </ECharts>
    </div>
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import { ECharts } from 'echarts'
import { merge } from 'lodash'

@Component({})
export default class AppChart extends Vue {
  @Prop({ type: Array, required: true })
  data!: any

  @Prop({ type: Object, default: {} })
  options!: any

  @Prop({ type: String, default: '100%' })
  height!: string;

  @Prop({ type: Array, default: () => [] })
  events!: any;

  @Ref('chart')
  chart!: any

  ready = false

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get isDark () {
    return this.$store.state.config.uiSettings.theme.isDark
  }

  @Watch('data')
  onData (data: any) {
    if (this.chart && data && data.length) {
      this.chart.inst.setOption({
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
      this.chart.inst.dispose()
    }
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    width: 100%;
  }
</style>
