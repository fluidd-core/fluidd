<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary">
      <v-icon left>{{ icons.fire }}</v-icon>
      <span class="font-weight-light">Temperatures</span>
    </v-card-title>
    <v-divider></v-divider>

    <temperature-targets-widget></temperature-targets-widget>

    <v-card-text class="chart-container">
      <temperature-chart-widget v-if="chartReady && klippyConnected" :chart-data="chartData" :styles="chartStyles"></temperature-chart-widget>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import TemperatureChartWidget from '@/components/widgets/TemperatureChartWidget.vue'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'
import { ChartData, Chart } from '@/store/socket/types'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    TemperatureChartWidget,
    TemperatureTargetsWidget
  }
})
export default class TemperatureCard extends Mixins(UtilsMixin) {
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
