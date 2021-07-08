<template>
  <v-col
    cols="4"
    class="chart-wrapper"
    v-if="ready"
  >
    <app-chart
      :data="chartData"
      :options="options"
      height="120px"
    >
    </app-chart>

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
    return this.$store.state.charts.memory || []
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions']({
        memused: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$store.getters['charts/getBaseSeries']({
      name: 'memory used',
      encode: { x: 'date', y: 'memused' }
    })
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
