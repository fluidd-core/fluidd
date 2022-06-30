<template>
  <collapsable-card
    :title="$t('app.general.title.temperature')"
    icon="$fire"
    :lazy="false"
    :draggable="true"
    layout-path="dashboard.temperature-card"
  >
    <template #title>
      <v-icon left>
        $fire
      </v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.temperature') }}</span>
      <app-inline-help
        bottom
        small
        :tooltip="$t('app.chart.tooltip.help')"
      />
    </template>

    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          class="ma-1"
          :disabled="!klippyReady"
          @click="chartVisible = !chartVisible"
        >
          <v-icon left>
            $chart
          </v-icon>
          {{ (chartVisible) ? $t('app.chart.label.off') : $t('app.chart.label.on') }}
        </app-btn>

        <temperature-presets-menu
          class="ma-1"
          @applyOff="handleApplyOff"
          @applyPreset="handleApplyPreset"
        />
      </app-btn-collapse-group>

      <app-btn-collapse-group
        :collapsed="true"
        menu-icon="$cog"
      >
        <v-checkbox
          v-model="showRateOfChange"
          :label="$t('app.setting.label.show_rate_of_change')"
          color="primary"
          hide-details
          class="mx-2 mt-2 mb-2"
        />
        <v-checkbox
          v-model="showRelativeHumidity"
          :label="$t('app.setting.label.show_relative_humidity')"
          color="primary"
          hide-details
          class="mx-2 mt-2 mb-2"
        />
        <v-checkbox
          v-model="showBarometricPressure"
          :label="$t('app.setting.label.show_barometric_pressure')"
          color="primary"
          hide-details
          class="mx-2 mt-2 mb-2"
        />
      </app-btn-collapse-group>
    </template>

    <temperature-targets
      @legendClick="legendToggleSelect"
      @legendPowerClick="legendTogglePowerSelect"
    />

    <thermal-chart
      v-if="chartReady && chartVisible"
      ref="thermalchart"
      :height="(isMobile) ? '180px' : '260px'"
    />
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

  @Ref('thermalchart')
  readonly thermalChart!: ThermalChart

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

  get showRateOfChange () {
    return this.$store.state.config.uiSettings.general.showRateOfChange
  }

  set showRateOfChange (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showRateOfChange',
      value,
      server: true
    })
  }

  get showRelativeHumidity () {
    return this.$store.state.config.uiSettings.general.showRelativeHumidity
  }

  set showRelativeHumidity (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showRelativeHumidity',
      value,
      server: true
    })
  }

  get showBarometricPressure () {
    return this.$store.state.config.uiSettings.general.showBarometricPressure
  }

  set showBarometricPressure (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showBarometricPressure',
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

  async handleApplyOff () {
    if (['printing', 'busy', 'paused'].includes(this.$store.getters['printer/getPrinterState'])) {
      const result = await this.$confirm(
        this.$tc('app.general.label.heaters_busy'),
        { title: this.$tc('app.general.simple_form.msg.confirm'), color: 'card-heading', icon: '$error' }
      )

      if (!result) {
        return
      }
    }

    this.sendGcode('TURN_OFF_HEATERS')
  }
}
</script>
