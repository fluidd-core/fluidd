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
    return this.$typedState.charts.klipper || []
  }

  get cores (): number {
    return this.$typedState.server.system_info?.cpu_info?.cpu_count || 1
  }

  get options () {
    const o = {
      ...this.$typedGetters['charts/getBaseChartOptions'](),
      series: this.series
    }

    if (
      o.yAxis &&
      !Array.isArray(o.yAxis)
    ) {
      o.yAxis.max = (value) => {
        return (value.max <= this.cores)
          ? this.cores
          : value.max
      }
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
