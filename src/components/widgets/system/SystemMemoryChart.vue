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
export default class SystemMemoryChart extends Vue {
  get chartData () {
    return this.$typedState.charts.memory || []
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.$t('app.system_info.label.system_memory').toString(),
        value: 'memused',
        suffix: '%'
      }
    ]
  }

  get options (): EChartsOption {
    return {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        memused: '%'
      }),
      series: this.series
    }
  }

  get series (): LineSeriesOption {
    return {
      ...this.$typedGetters['charts/getBaseSeries'],
      name: this.$t('app.system_info.label.memory_used').toString(),
      encode: {
        x: 'date',
        y: 'memused'
      }
    }
  }
}
</script>
