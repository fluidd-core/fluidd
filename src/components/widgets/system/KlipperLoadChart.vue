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
        <span>{{ $t('app.system_info.label.klipper_load') }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].cputime_change }}%</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class KlipperLoadChart extends Vue {
  ready = false

  get chartData () {
    return this.$typedState.charts.klipper || []
  }

  get options () {
    const o = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        cputime_change: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$typedGetters['charts/getBaseSeries']({
      name: this.$t('app.system_info.label.load'),
      encode: { x: 'date', y: 'cputime_change' }
    })
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
