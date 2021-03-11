<template>
  <collapsable-card
    title="Thermals"
    icon="$fire"
    :lazy="false"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

    <template v-slot:title>
      <v-icon left>$fire</v-icon>
      <span class="font-weight-light">Thermals</span>
      <inline-help
        bottom
        small
        tooltip="Hold shift to zoom.<br />
          Click an item to toggle in the graph.<br />
          Click a power to toggle in the graph."
      ></inline-help>

    </template>

    <template v-slot:menu>
      <btn
        small
        class="mr-2"
        color="secondary"
        @click="chartVisible = !chartVisible">
        <v-icon left>$chart</v-icon>
        {{ (chartVisible) ? 'on' : 'off' }}
      </btn>
    </template>

    <temperature-targets-widget
      @legendClick="legendToggleSelect"
      @legendPowerClick="legendTogglePowerSelect">
    </temperature-targets-widget>

    <e-charts-widget
      v-if="chartReady && chartVisible"
      :chart-data="chartData"
      ref="chart"
      @legend-select-changed="handleLegendSelectChange"
    ></e-charts-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'
import EChartsWidget from '@/components/widgets/EChartsWidget.vue'
import UtilsMixin from '@/mixins/utils'
import { Fan, Heater } from '@/store/socket/types'
// import { ChartSelectedLegends } from '@/store/config/types'

@Component({
  components: {
    TemperatureTargetsWidget,
    EChartsWidget
  }
})
export default class TemperatureGraphCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get chartData () {
    return this.$store.getters['socket/getChartData']
  }

  get chartReady () {
    return (
      this.$store.state.socket.acceptingNotifications &&
      this.$store.state.socket.ready &&
      this.klippyConnected
    )
  }

  handleLegendSelectChange (legendsSelected: { name: string; type: string; selected: {[index: string]: boolean } }) {
    this.$store.dispatch('config/saveGeneric', { key: 'appState.chartSelectedLegends', value: legendsSelected.selected })
  }

  legendToggleSelect (item: Heater | Fan) {
    // If this has a target, toggle that too.
    const ref = this.$refs.chart as EChartsWidget
    if ('target' in item) {
      ref.legendToggleSelect(item.name + 'Target')
    }
    ref.legendToggleSelect(item.name)
  }

  legendTogglePowerSelect (item: Heater | Fan) {
    const ref = this.$refs.chart as EChartsWidget
    const name = ('speed' in item)
      ? item.name + 'Speed'
      : item.name + 'Power'
    ref.legendToggleSelect(name)
  }

  get chartVisible () {
    return this.$store.state.config.uiSettings.general.chartVisible
  }

  set chartVisible (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.chartVisible', value })
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
