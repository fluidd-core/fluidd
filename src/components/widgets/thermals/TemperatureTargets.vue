<template>
  <div>
    <v-simple-table class="temperature-table">
      <thead>
        <tr>
          <th width="1%" />
          <th :width="showRateOfChange ? '94%' : '95%'">
            {{ $t('app.chart.label.item') }}
          </th>
          <th width="1%">
            {{ $t('app.chart.label.power') }}
          </th>
          <th
            v-if="showRateOfChange"
            width="1%"
          >
            {{ $t('app.chart.label.rate_of_change') }}
          </th>
          <th width="1%">
            {{ $t('app.chart.label.current') }}
          </th>
          <th width="1%" />
          <th width="1%">
            {{ $t('app.chart.label.target') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in heaters"
          :key="item.name"
        >
          <td>
            <v-icon
              small
              :color="item.color"
            >
              $fire
            </v-icon>
          </td>
          <td class="temp-name">
            <span
              :class="{ 'active': chartSelectedLegends[item.name] }"
              class="legend-item"
              @click="$emit('legendClick', item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
            <span
              :class="{ 'active': chartSelectedLegends[item.name + 'Power'] }"
              class="legend-item"
              @click="$emit('legendPowerClick', item)"
            >
              <span v-if="item.power <= 0 && item.target <= 0">off</span>
              <span v-if="item.target > 0">
                {{ (item.power) ? (item.power * 100).toFixed() : 0 }}<small>%</small>
              </span>
            </span>
          </td>
          <td
            v-if="showRateOfChange"
            class="rate-of-change"
          >
            <span
              :class="{ 'active': chartSelectedLegends[item.name + 'Power'] }"
              class="legend-item"
            >
              <span>{{ getRateOfChange(item) }}<small>&deg;C/s</small></span>
            </span>
          </td>
          <td class="temp-actual">
            {{ (item.temperature) ? item.temperature.toFixed(1) : 0 }}<small>°C</small>
          </td>
          <td>/</td>
          <td>
            <input-temperature
              v-if="klippyReady"
              :value="item.target"
              :max="item.maxTemp"
              :min="item.minTemp"
              @input="setHeaterTargetTemp(item.name, $event)"
            />
          </td>
        </tr>
        <tr
          v-for="item in fans"
          :key="item.name"
        >
          <td>
            <v-icon
              small
              :class="{ 'spin': item.speed > 0 && item.target > 0 }"
              :color="item.color"
            >
              $fan
            </v-icon>
          </td>
          <td class="temp-name">
            <span
              :class="{ 'active': chartSelectedLegends[item.name] }"
              class="legend-item"
              @click="$emit('legendClick', item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
            <span
              v-if="item.speed"
              :class="{ 'active': chartSelectedLegends[item.name + 'Speed'] }"
              class="legend-item"
              @click="$emit('legendPowerClick', item)"
            >
              <span v-if="item.speed > 0 && (item.target > 0 || !item.target)">
                {{ (item.speed * 100).toFixed(0) }}<small>%</small>
              </span>
              <span v-if="item.speed <= 0 && item.target && item.target > 0">
                standby
              </span>
              <span v-if="item.speed <=0 && ((item.target && item.target <= 0) || !item.target)">off</span>
            </span>
          </td>
          <td class="temp-actual">
            <span v-if="item.temperature">
              {{ item.temperature.toFixed(1) }}<small>°C</small>
            </span>
          </td>
          <td>/</td>
          <td>
            <input-temperature
              v-if="klippyReady && item.type === 'temperature_fan'"
              :value="item.target"
              :max="item.maxTemp"
              :min="item.minTemp"
              @input="setFanTargetTemp(item.name, $event)"
            />
          </td>
        </tr>
        <tr
          v-for="item in sensors"
          :key="item.name"
        >
          <td>
            <v-icon
              small
              :color="item.color"
            >
              $thermometer
            </v-icon>
          </td>
          <td class="temp-name">
            <span
              :class="{ 'active': chartSelectedLegends[item.name] }"
              class="legend-item"
              @click="$emit('legendClick', item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
&nbsp;
          </td>
          <td
            v-if="showRateOfChange"
            class="rate-of-change"
          >
&nbsp;
          </td>
          <td class="temp-actual">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <span
                  v-bind="attrs"
                  v-on="on"
                >{{ item.temperature.toFixed(1) }}<small>°C</small></span>
              </template>
              <span v-if="item.measured_max_temp && item.measured_min_temp">
                <span class="">{{ $t('app.general.label.high') }}: {{ item.measured_max_temp.toFixed(1) }}°C</span><br>
                <span class="">{{ $t('app.general.label.low') }}: {{ item.measured_min_temp.toFixed(1) }}°C</span>
              </span>
            </v-tooltip>
          </td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-divider v-if="chartVisible" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TemperaturePresetsMenu from './TemperaturePresetsMenu.vue'
import InputTemperature from './InputTemperature.vue'
import StateMixin from '@/mixins/state'
import { Heater, Sensor } from '@/store/printer/types'

@Component({
  components: {
    TemperaturePresetsMenu,
    InputTemperature
  }
})
export default class TemperatureTargets extends Mixins(StateMixin) {
  get colors () {
    return this.$colorset.colorList
  }

  get extruder () {
    return this.$store.state.printer.printer.extruder
  }

  get heaters () {
    return this.$store.getters['printer/getHeaters']
  }

  get fans () {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get sensors () {
    return this.$store.getters['printer/getSensors']
  }

  get chartableSensors () {
    return this.$store.getters['printer/getChartableSensors']
  }

  get chartSelectedLegends () {
    return this.$store.getters['charts/getSelectedLegends']
  }

  get chartVisible () {
    return this.$store.state.config.uiSettings.general.chartVisible
  }

  get showRateOfChange () {
    return this.$store.state.config.uiSettings.general.showRateOfChange
  }

  setHeaterTargetTemp (heater: string, target: number) {
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${heater} TARGET=${target}`)
  }

  setFanTargetTemp (fan: string, target: number) {
    this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${fan} TARGET=${target}`)
  }

  getRateOfChange (item: Heater | Sensor) {
    const chartData = this.$store.getters['charts/getChartData']
    let rateOfChange = 0
    if (chartData.length >= 2) {
      const curr = chartData[chartData.length - 1]
      const prev = chartData[chartData.length - Math.min(chartData.length, 5)] // rolling average of the last min(n, 5) data points
      rateOfChange = (curr[item.name] - prev[item.name]) / (curr.date - prev.date) * 1000

      if (Math.abs(rateOfChange) < 0.05) {
        rateOfChange = 0 // prevent constant change of sign
      }
    }

    return `${rateOfChange < 0 ? '' : '+'}${rateOfChange.toFixed(1)}`
  }
}
</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';
  @import '@/scss/variables.scss';

  .theme--light ::v-deep .v-data-table.temperature-table > .v-data-table__wrapper > table {
    color: rgba(map-get($material-light, 'text-color'), 1);
    .temp-actual {
      color: rgba(map-get($material-light, 'text-color'), 1);
    }
  }

  .theme--dark ::v-deep .v-data-table.temperature-table > .v-data-table__wrapper > table {
    color: rgba(map-get($material-dark, 'text-color'), 1);
    .temp-actual {
      color: rgba(map-get($material-dark, 'text-color'), 1);
    }
  }

  ::v-deep .v-data-table.temperature-table > .v-data-table__wrapper > table {

    .temp-name,
    .temp-power {
      font-size: 1rem;
    }

    .temp-actual {
      font-weight: 300;
      font-size: 1.125rem;
    }

    > thead > tr > th {
      height: 40px;
    }

    // The icon
    > thead > tr > th:first-child,
    > tbody > tr > td:first-child {
      padding-right: 0px;
    }

    // The name
    > thead > tr > th:nth-child(2),
    > tbody > tr > td:nth-child(2) {
      padding-left: 8px;
    }

    // The power
    > thead > tr > th:nth-last-child(3),
    > tbody > tr > td:nth-last-child(3) {
      padding-right: 0px;
    }

    // The /
    > thead > tr > th:nth-last-child(2),
    > tbody > tr > td:nth-last-child(2) {
      font-size: 1rem;
      padding-left: 12px;
      padding-right: 16px;
    }

    // The temp entry
    > thead > tr > th:last-child,
    > tbody > tr > td:last-child {
      padding-left: 0px;
    }
  }

  .legend-item {
    display: inline-block;
    cursor: pointer;
    opacity: 0.45
  }

  .legend-item.active {
    opacity: 1
  }
</style>
