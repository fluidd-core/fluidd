<template>
  <v-card class="mb-4">
    <v-card-title >
      <v-icon large left>mdi-fire</v-icon>
      <span class="font-weight-light">Temperatures</span>
    </v-card-title>

    <temperature-targets-widget></temperature-targets-widget>

    <v-card-text class="chart-container">
      <temperature-chart-widget v-if="chartReady" :chart-data="chartData" :styles="chartStyles"></temperature-chart-widget>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import TemperatureChartWidget from '@/components/widgets/TemperatureChartWidget.vue'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'
import { ChartData, Chart } from '@/store/socket/types'

@Component({
  components: {
    TemperatureChartWidget,
    TemperatureTargetsWidget
  }
})
export default class TemperatureCard extends Vue {
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
