<template>
  <v-col
    v-if="ready"
    cols="4"
    class="chart-wrapper"
  >
    <app-chart
      :data="chartData"
      :options="options"
      height="120px"
    />

    <div class="chart-label-wrapper">
      <div class="chart-label">
        <span>{{ $t('app.system_info.label.system_memory') }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].memused }}%</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class SystemMemoryChart extends Vue {
  ready = false

  get chartData () {
    return this.$typedState.charts.memory || []
  }

  get options () {
    const o = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        memused: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$typedGetters['charts/getBaseSeries']({
      name: this.$t('app.system_info.label.memory_used'),
      encode: { x: 'date', y: 'memused' }
    })
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
