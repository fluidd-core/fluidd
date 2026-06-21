<template>
  <system-chart
    :data="chartData"
    :options="options"
  >
    <div class="chart-label">
      <span>{{ $t('app.system_info.label.system_memory') }}</span>
      <span v-if="chartData.length">{{ chartData[chartData.length - 1].memused }}%</span>
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
export default class SystemMemoryChart extends Vue {
  get chartData () {
    return this.$typedState.charts.memory || []
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
