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
export default class MoonrakerLoadChart extends Vue {
  get chartData () {
    return this.$typedState.charts.moonraker || []
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.$t('app.system_info.label.moonraker_load').toString(),
        value: 'load',
        suffix: '%'
      }
    ]
  }

  get options (): EChartsOption {
    return {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        load: '%'
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
        y: 'load'
      }
    }
  }
}
</script>
