<template>
  <collapsable-card
    :title="$t('app.general.title.temperature')"
    icon="$fire"
    :lazy="false"
    draggable
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
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          small
          :disabled="!klippyReady"
          class="ms-1 my-1"
          @click="chartVisible = !chartVisible"
        >
          <v-icon left>
            $chart
          </v-icon>
          {{ (chartVisible) ? $t('app.chart.label.off') : $t('app.chart.label.on') }}
        </app-btn>

        <temperature-presets-menu
          @applyOff="handleApplyOff"
          @applyPreset="handleApplyPreset"
        />
      </app-btn-collapse-group>

      <v-menu
        bottom
        left
        offset-y
        transition="slide-y-transition"
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            fab
            x-small
            text
            v-bind="attrs"
            class="ms-1 my-1"
            v-on="on"
          >
            <v-icon>
              $cog
            </v-icon>
          </v-btn>
        </template>

        <v-list dense>
          <v-list-item @click="showRateOfChange = !showRateOfChange">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="showRateOfChange" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.setting.label.show_rate_of_change') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="showRelativeHumidity = !showRelativeHumidity">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="showRelativeHumidity" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.setting.label.show_relative_humidity') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="showBarometricPressure = !showBarometricPressure">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="showBarometricPressure" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.setting.label.show_barometric_pressure') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="showGasResistance = !showGasResistance">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="showGasResistance" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.setting.label.show_gas_resistance') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

    <temperature-targets
      @legendClick="legendToggleSelect"
      @legendPowerClick="legendTogglePowerSelect"
    />

    <template v-if="chartReady && chartVisible">
      <v-divider />

      <thermal-chart
        ref="thermalchart"
        :height="(isMobileViewport) ? '180px' : '260px'"
      />
    </template>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
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
export default class TemperatureCard extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Boolean, default: false })
  readonly menuCollapsed!: boolean

  @Ref('thermalchart')
  readonly thermalChartElement!: ThermalChart

  get chartReady () {
    return (
      this.$store.state.socket.acceptingNotifications &&
      this.$store.state.socket.ready &&
      this.$store.state.charts.ready &&
      this.klippyReady
    )
  }

  debugme (val:any) {
    console.log({ val })
  }

  legendToggleSelect (item: Heater | Fan) {
    // If this has a target, toggle that too.
    if (this.chartVisible) {
      if ('target' in item) {
        this.thermalChartElement.legendToggleSelect(item.name + 'Target')
      }
      this.thermalChartElement.legendToggleSelect(item.name)
    }
  }

  legendTogglePowerSelect (item: Heater | Fan) {
    if (this.chartVisible) {
      const name = ('speed' in item)
        ? item.name + 'Speed'
        : item.name + 'Power'
      this.thermalChartElement.legendToggleSelect(name)
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

  get showGasResistance () {
    return this.$store.state.config.uiSettings.general.showGasResistance
  }

  set showGasResistance (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showGasResistance',
      value,
      server: true
    })
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
