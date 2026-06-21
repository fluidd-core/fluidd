<template>
  <system-chart
    :data="chartData"
    :options="options"
  >
    <div class="chart-label">
      <span>{{ $t('app.system_info.label.klipper_load') }}</span>
      <span v-if="chartData.length">{{ chartData[chartData.length - 1].cputime_change }}%</span>
    </div>
  </system-chart>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import SystemChart from './SystemChart.vue'

@Component({
  components: {
    SystemChart
  }
})
export default class KlipperLoadChart extends Vue {
  get chartData () {
    return this.$typedState.charts.klipper || []
  }

  get options (): EChartsOption {
    return {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        cputime_change: '%'
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
