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
    />

    <div class="chart-label-wrapper">
      <div class="chart-label">
        <span>{{ $t('app.system_info.label.system_load') }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }} / {{ cores }}</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class SystemLoadChart extends Vue {
  ready = false

  get chartData () {
    return this.$store.state.charts.klipper || []
  }

  get cores () {
    return this.$store.state.server?.system_info?.cpu_info?.cpu_count || 1
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions'](),
      series: this.series
    }
    o.yAxis.max = (value: any) => {
      return (value.max <= this.cores)
        ? this.cores
        : value.max
    }
    return o
  }

  get series () {
    return this.$store.getters['charts/getBaseSeries']({
      name: 'load',
      encode: { x: 'date', y: 'load' }
    })
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
