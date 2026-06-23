<template>
  <app-inline-chart
    :data="chartData"
    :options="options"
    :labels="labels"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import type { AppInlineChartLabel } from '@/components/ui/AppInlineChart.vue'

@Component({})
export default class SystemLoadChart extends Vue {
  get chartData () {
    return this.$typedState.charts.klipper || []
  }

  get cores (): number {
    return this.$typedState.server.system_info?.cpu_info?.cpu_count || 1
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.$t('app.system_info.label.system_load').toString(),
        value: 'load',
        suffix: ` / ${this.cores}`
      }
    ]
  }

  get options (): EChartsOption {
    const options: EChartsOption = {
      ...this.$typedGetters['charts/getBaseChartOptions'](),
      series: this.series
    }

    if (
      options.yAxis &&
      !Array.isArray(options.yAxis)
    ) {
      options.yAxis.max = (value) => Math.max(this.cores, value.max)
    }

    return options
  }

  get series (): LineSeriesOption {
    return {
      ...this.$typedGetters['charts/getBaseSeries'],
      name: this.$t('app.system_info.label.load').toString(),
      encode: {
        x: 'date',
        y: 'load'
      }
    }
  }
}
</script>
