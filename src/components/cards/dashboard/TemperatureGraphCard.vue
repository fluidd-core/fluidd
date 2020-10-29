<template>
  <collapsable-card
    :loading="loading"
    title="Temperature"
    icon="$chart">

    <v-card-text class="chart-container">
      <temperature-chart-widget @hook:mounted="chartMounted()" v-if="chartReady && klippyConnected" :chart-data="chartData" :styles="chartStyles"></temperature-chart-widget>
    </v-card-text>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ChartData, Chart } from '@/store/socket/types'
import UtilsMixin from '@/mixins/utils'

const TemperatureChartWidget = () => import(/* webpackChunkName: "tempchart", webpackPrefetch: true */ '@/components/widgets/TemperatureChartWidget.vue')

@Component({
  components: {
    TemperatureChartWidget
  }
})
export default class TemperatureGraphCard extends Mixins(UtilsMixin) {
  private chartData: Chart.ChartData = {}
  private startInterval!: number | undefined
  private chartReady = false
  private chartStyles = {
    overflow: 'auto',
    position: 'relative',
    height: '250px',
    width: '100%',
    margin: 'auto'
  }

  loading = true

  chartMounted () {
    this.loading = false
  }

  get allChartData () {
    return this.$store.getters['socket/getChartData']
  }

  @Watch('allChartData')
  onAllChartDataChanged (val: Chart) {
    if (val.datasets && val.datasets.length) {
      this.start()
    }
  }

  private start () {
    this.chartData = this.allChartData
    this.chartReady = true
  }
}
</script>

<style lang="scss">
  .chart-container {
    canvas {
      width: 100% !important;
    }
  }
</style>
