<template>
  <system-chart
    :data="chartData"
    :options="options"
  >
    <div class="chart-label">
      <span>{{ $t('app.system_info.label.system_load') }}</span>
      <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }} / {{ cores }}</span>
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
export default class SystemLoadChart extends Vue {
  get chartData () {
    return this.$typedState.charts.klipper || []
  }

  get cores (): number {
    return this.$typedState.server.system_info?.cpu_info?.cpu_count || 1
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
