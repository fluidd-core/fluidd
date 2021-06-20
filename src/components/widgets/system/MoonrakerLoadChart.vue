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
        <span>{{ $t('app.system_info.label.moonraker_load') }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }}%</span>
      </div>
    </div>

  </v-col>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class MoonrakerLoadChart extends Vue {
  ready = false

  get chartData () {
    return this.$store.state.charts.moonraker || []
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions']({
        load: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$store.getters['charts/getBaseSeries']({
      name: 'load',
      encode: { x: 'date', y: 'load' }
    })
  }

  mounted () {
    if (this.chartData && this.chartData.length > 0) this.ready = true
  }
}
</script>
