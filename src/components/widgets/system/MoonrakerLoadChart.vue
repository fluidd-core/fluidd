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
        <span>{{ $t('app.system_info.label.moonraker_load') }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }}%</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class MoonrakerLoadChart extends Vue {
  ready = false

  get chartData () {
    return this.$typedState.charts.moonraker || []
  }

  get options () {
    const o = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        load: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$typedGetters['charts/getBaseSeries']({
      name: this.$t('app.system_info.label.load'),
      encode: { x: 'date', y: 'load' }
    })
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
