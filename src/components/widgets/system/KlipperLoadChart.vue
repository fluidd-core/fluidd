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
import type { ChartDataSource } from '@/util/chart-buffer'
import { chartBufferSource } from '@/util/chart-buffer'

@Component({})
export default class KlipperLoadChart extends Vue {
  get chartData (): ChartDataSource {
    return chartBufferSource(this.$typedState.charts.klipper)
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.$t('app.system_info.label.klipper_load').toString(),
        value: 'cputime_change',
        suffix: ' %'
      }
    ]
  }

  get options (): EChartsOption {
    return {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        cputime_change: ' %'
      }),
      series: this.series
    }
  }

  get series (): LineSeriesOption {
    return {
      ...this.$typedGetters['charts/getBaseSeries'],
      name: this.$t('app.system_info.label.load').toString(),
      encode: {
        x: 'date',
        y: 'cputime_change'
      }
    }
  }
}
</script>
