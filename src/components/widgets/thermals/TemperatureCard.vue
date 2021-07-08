<template>
  <collapsable-card
    :title="$t('app.general.title.temperature')"
    icon="$fire"
    :lazy="false"
    :draggable="true"
    layout-path="dashboard.temperature-card">

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
      <app-btn-collapse-group>
        <app-btn
          small
          class="ma-1"
          :disabled="!klippyReady"
          @click="chartVisible = !chartVisible">
          <v-icon left>$chart</v-icon>
          {{  (chartVisible) ? $t('app.chart.label.off') : $t('app.chart.label.on') }}
        </app-btn>

        <temperature-presets-menu
          class="ma-1"
          @applyOff="handleApplyOff"
          @applyPreset="handleApplyPreset"
        ></temperature-presets-menu>
      </app-btn-collapse-group>
    </template>

    <temperature-targets
      @legendClick="legendToggleSelect"
      @legendPowerClick="legendTogglePowerSelect">
    </temperature-targets>

    <thermal-chart
      v-if="chartReady && chartVisible"
      ref="thermalchart"
      :height="(isMobile) ? '180px' : '260px'"
    ></thermal-chart>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Fan, Heater } from '@/store/printer/types'

import ThermalChart from '@/components/widgets/thermals/ThermalChart.vue'
import TemperatureTargets from '@/components/widgets/thermals/TemperatureTargets.vue'
import TemperaturePresetsMenu from './TemperaturePresetsMenu.vue'
import { TemperaturePreset } from '@/store/config/types'

@Component({
  components: {
    ThermalChart,
    TemperatureTargets,
    TemperaturePresetsMenu
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
    if (this.chartVisible) {
      if ('target' in item) {
        this.thermalChart.legendToggleSelect(item.name + 'Target')
      }
      this.thermalChart.legendToggleSelect(item.name)
    }
  }

  legendTogglePowerSelect (item: Heater | Fan) {
    if (this.chartVisible) {
      const name = ('speed' in item)
        ? item.name + 'Speed'
        : item.name + 'Power'
      this.thermalChart.legendToggleSelect(name)
    }
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

  handleApplyPreset (preset: TemperaturePreset) {
    if (preset) {
      if (preset.values) {
        for (const key in preset.values) {
          const item = preset.values[key]
          if (item.type === 'heater' && item.active && item.value > -1) {
            this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${key} TARGET=${item.value}`)
          }
          if (item.type === 'fan' && item.active && item.value > -1) {
            this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${key} TARGET=${item.value}`)
          }
        }
      }

      if (preset.gcode) {
        this.sendGcode(preset.gcode)
      }
    }
  }

  handleApplyOff () {
    this.sendGcode('TURN_OFF_HEATERS')
  }
}
</script>
