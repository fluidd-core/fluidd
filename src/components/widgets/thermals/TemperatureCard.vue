<template>
  <collapsable-card
    :title="$t('app.general.title.temperature')"
    icon="$fire"
    :lazy="false"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

    <template v-slot:title>
      <v-icon left>$fire</v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.temperature') }}</span>
      <app-inline-help
        bottom
        small
        :tooltip="$t('app.chart.tooltip.help')"
      ></app-inline-help>

    </template>

    <template v-slot:menu>
      <app-btn
        small
        class="mr-2"
        :disabled="!klippyReady"
        @click="chartVisible = !chartVisible">
        <v-icon left>$chart</v-icon>
        {{ (chartVisible) ? 'on' : 'off' }}
      </app-btn>
    </template>

    <temperature-targets
      @legendClick="legendToggleSelect"
      @legendPowerClick="legendTogglePowerSelect">
    </temperature-targets>

    <thermal-chart
      v-if="chartReady && chartVisible"
      ref="thermalchart"
      :height="(isMobile) ? '225px' : '325px'"
    ></thermal-chart>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Fan, Heater } from '@/store/printer/types'

import ThermalChart from '@/components/widgets/thermals/ThermalChart.vue'
import TemperatureTargets from '@/components/widgets/thermals/TemperatureTargets.vue'

@Component({
  components: {
    ThermalChart,
    TemperatureTargets
  }
})
export default class TemperatureCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  @Ref('thermalchart') readonly thermalChart!: ThermalChart

  get chartReady () {
    return (
      this.$store.state.socket.acceptingNotifications &&
      this.$store.state.socket.ready &&
      this.$store.state.charts.ready &&
      this.klippyReady
    )
  }

  legendToggleSelect (item: Heater | Fan) {
    // If this has a target, toggle that too.
    if ('target' in item) {
      this.thermalChart.legendToggleSelect(item.name + 'Target')
    }
    this.thermalChart.legendToggleSelect(item.name)
  }

  legendTogglePowerSelect (item: Heater | Fan) {
    const name = ('speed' in item)
      ? item.name + 'Speed'
      : item.name + 'Power'
    this.thermalChart.legendToggleSelect(name)
  }

  get chartVisible () {
    return this.$store.state.config.uiSettings.general.chartVisible
  }

  set chartVisible (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.chartVisible',
      value,
      server: true
    })
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
