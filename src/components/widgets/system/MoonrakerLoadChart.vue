<template>
  <system-chart
    :data="chartData"
    :options="options"
  >
    <div class="chart-label">
      <span>{{ $t('app.system_info.label.moonraker_load') }}</span>
      <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }}%</span>
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
export default class MoonrakerLoadChart extends Vue {
  get chartData () {
    return this.$typedState.charts.moonraker || []
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
