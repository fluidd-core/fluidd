<template>
  <div>
    <v-simple-table class="temperature-table">
      <thead>
        <tr>
          <th />
          <th width="100%">
            {{ $t('app.chart.label.item') }}
          </th>
          <th>
            {{ $t('app.chart.label.power') }}
          </th>
          <th
            v-if="showRateOfChange"
          >
            {{ $t('app.chart.label.rate_of_change') }}
          </th>
          <th>
            {{ $t('app.chart.label.current') }}
          </th>
          <th />
          <th>
            {{ $t('app.chart.label.target') }}
          </th>
        </tr>
      </thead>
      <tbody v-if="klippyReady">
        <tr
          v-for="item in heaters"
          :key="item.key"
          @contextmenu.prevent="handleHeaterRowClick(item, $event)"
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
              :class="{ 'active': isLegendSelected(item) }"
              class="legend-item toggle"
              @click="legendClick(item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
            <span
              :class="{ 'active': isLegendSelected(item, '#power') }"
              class="legend-item toggle"
              @click="legendClick(item, '#power')"
            >
              <span v-if="item.power <= 0 && item.target <= 0">off</span>
              <span v-if="item.target > 0">
                {{ (item.power) ? (item.power * 100).toFixed() : 0 }}<small>%</small>
              </span>
            </span>
          </td>
          <td
            v-if="showRateOfChange"
            class="text-no-wrap"
          >
            <span
              :class="{ 'active': isLegendSelected(item, '#power') }"
              class="legend-item toggle"
              @click="legendClick(item, '#power')"
            >
              <span>{{ getRateOfChange(item) }}<small>&deg;C/s</small></span>
            </span>
          </td>
          <td class="temp-actual">
            {{ (item.temperature) ? item.temperature.toFixed(1) : 0 }}<small>°C</small>
          </td>
          <td>/</td>
          <td @contextmenu.stop>
            <app-text-field
              v-if="klippyReady"
              :value="item.target"
              :rules="[
                $rules.required,
                $rules.numberValid,
                $rules.numberGreaterThanOrEqualOrZero(item.minTemp),
                $rules.numberLessThanOrEqualOrZero(item.maxTemp)
              ]"
              type="number"
              outlined
              dense
              single-line
              hide-details="auto"
              suffix="°C"
              x-small
              @submit="setHeaterTargetTemp(item.name, +$event)"
            />
          </td>
        </tr>
        <tr
          v-for="item in fans"
          :key="item.key"
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
              :class="{ 'active': isLegendSelected(item) }"
              class="legend-item toggle"
              @click="legendClick(item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
            <span
              v-if="item.speed"
              :class="{ 'active':isLegendSelected(item, '#speed') }"
              class="legend-item toggle"
              @click="legendClick(item, '#speed')"
            >
              <span v-if="item.speed > 0 && (item.target > 0 || !item.target)">
                {{ (item.speed * 100).toFixed(0) }}<small>%</small>
              </span>
              <span v-if="item.speed <= 0 && item.target && item.target > 0">
                {{ $t('app.printer.state.standby') }}
              </span>
              <span v-if="item.speed <=0 && ((item.target && item.target <= 0) || !item.target)">off</span>
            </span>
          </td>
          <td
            v-if="showRateOfChange"
            class="text-no-wrap"
          >
            <span
              :class="{ 'active': isLegendSelected(item, '#power') }"
              class="legend-item toggle"
              @click="legendClick(item, '#power')"
            >
              <span>{{ getRateOfChange(item) }}<small>&deg;C/s</small></span>
            </span>
          </td>
          <td class="temp-actual">
            <span v-if="item.temperature">
              {{ item.temperature.toFixed(1) }}<small>°C</small>
              <small v-if="item.humidity != null && showRelativeHumidity"><br>{{ item.humidity.toFixed(1) }} %</small>
              <small v-if="item.pressure != null && showBarometricPressure"><br>{{ $filters.getReadableAtmosphericPressureString(item.pressure) }}</small>
              <small v-if="item.gas != null && showGasResistance"><br>{{ $filters.getReadableResistanceString(item.gas) }}</small>
            </span>
            <span v-else>
              -
            </span>
          </td>
          <td>/</td>
          <td @contextmenu.stop>
            <app-text-field
              v-if="klippyReady && item.type === 'temperature_fan'"
              :value="item.target"
              :rules="[
                $rules.required,
                $rules.numberValid,
                $rules.numberGreaterThanOrEqualOrZero(item.minTemp),
                $rules.numberLessThanOrEqualOrZero(item.maxTemp)
              ]"
              type="number"
              outlined
              dense
              single-line
              hide-details="auto"
              suffix="°C"
              x-small
              @submit="setFanTargetTemp(item.name, +$event)"
            />
          </td>
        </tr>
        <tr
          v-for="item in sensors"
          :key="item.key"
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
              :class="{ 'active': isLegendSelected(item) }"
              class="legend-item toggle"
              @click="legendClick(item)"
            >
              {{ item.prettyName }}
            </span>
          </td>
          <td class="temp-power">
            &nbsp;
          </td>
          <td
            v-if="showRateOfChange"
            class="text-no-wrap"
          >
            <span class="legend-item">
              {{ getRateOfChange(item) }}<small>&deg;C/s</small>
            </span>
          </td>
          <td class="temp-actual">
            <v-tooltip
              left
              :disabled="item.measured_max_temp == null && item.measured_min_temp == null"
            >
              <template #activator="{ on, attrs }">
                <div
                  v-bind="attrs"
                  v-on="on"
                >
                  <span v-if="item.temperature != null">
                    {{ item.temperature.toFixed(1) }}<small>°C</small>
                    <small v-if="item.humidity != null && showRelativeHumidity"><br>{{ item.humidity.toFixed(1) }} %</small>
                    <small v-if="item.pressure != null && showBarometricPressure"><br>{{ $filters.getReadableAtmosphericPressureString(item.pressure) }}</small>
                    <small v-if="item.gas != null && showGasResistance"><br>{{ $filters.getReadableResistanceString(item.gas) }}</small>
                    <small v-if="item.current_z_adjust != null"><br>{{ $filters.getReadableLengthString(item.current_z_adjust, true) }}</small>
                  </span>
                  <span v-else>
                    -
                  </span>
                </div>
              </template>
              <span>
                {{ $t('app.general.label.high') }}: {{ item.measured_max_temp?.toFixed(1) ?? '-' }}°C<br>
                {{ $t('app.general.label.low') }}: {{ item.measured_min_temp?.toFixed(1) ?? '-' }}°C
              </span>
            </v-tooltip>
          </td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr
          v-for="item in nevermore"
          :key="item.key"
        >
          <td>
            <v-icon
              small
              :color="item.color"
            >
              $fan
            </v-icon>
          </td>
          <td class="temp-name">
            <span class="legend-item">
              {{ item.prettyName }}
            </span>
          </td>
          <td
            class="temp-actual"
            :colspan="showRateOfChange ? 3 : 2"
          >
            <span>
              <template v-for="sensor in getNevermoreSensors(item)">
                <v-tooltip
                  :key="`${item.key}-${sensor.key}`"
                  left
                  :disabled="sensor.disableTooltip"
                >
                  <template #activator="{ on, attrs }">
                    <div
                      v-bind="attrs"
                      v-on="on"
                    >
                      <component :is="sensor.small ? 'small' : 'span'">
                        {{ sensor.intake ?? '-' }} &rarr; {{ sensor.exhaust ?? '-' }}{{ sensor.unit }}
                      </component>
                    </div>
                  </template>
                  <span>
                    {{ $t('app.general.label.high') }}: {{ sensor.intake_max ?? '-' }} &rarr; {{ sensor.exhaust_max ?? '-' }}{{ sensor.unit }}<br>
                    {{ $t('app.general.label.low') }}: {{ sensor.intake_min ?? '-' }} &rarr; {{ sensor.exhaust_min ?? '-' }}{{ sensor.unit }}
                  </span>
                </v-tooltip>
              </template>
              <small v-if="item.rpm != null">{{ item.rpm }} RPM</small>
            </span>
          </td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </v-simple-table>

    <heater-context-menu
      v-if="contextMenuState.open"
      v-model="contextMenuState.open"
      :heater="contextMenuState.heater"
      :position-x="contextMenuState.x"
      :position-y="contextMenuState.y"
      @pid-calibrate="handlePidCalibrateDialog"
      @mpc-calibrate="handleMpcCalibrateDialog"
      @turn-off="handleTurnOff"
    />

    <heater-pid-calibrate-dialog
      v-if="heaterPidCalibrateDialog.open"
      v-model="heaterPidCalibrateDialog.open"
      :heater="heaterPidCalibrateDialog.heater"
      @save="handlePidCalibrate"
    />

    <heater-mpc-calibrate-dialog
      v-if="heaterMpcCalibrateDialog.open"
      v-model="heaterMpcCalibrateDialog.open"
      :heater="heaterMpcCalibrateDialog.heater"
      @save="handleMpcCalibrate"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TemperaturePresetsMenu from './TemperaturePresetsMenu.vue'
import HeaterContextMenu from './HeaterContextMenu.vue'
import HeaterPidCalibrateDialog from './HeaterPidCalibrateDialog.vue'
import HeaterMpcCalibrateDialog from './HeaterMpcCalibrateDialog.vue'
import StateMixin from '@/mixins/state'
import type { Fan, Heater, Sensor } from '@/store/printer/types'
import { takeRightWhile } from 'lodash-es'
import type { ChartData, ChartSelectedLegends } from '@/store/charts/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import isNullOrEmpty, { type NullableOrEmpty } from '@/util/is-null-or-empty'

@Component({
  components: {
    TemperaturePresetsMenu,
    HeaterContextMenu,
    HeaterPidCalibrateDialog,
    HeaterMpcCalibrateDialog
  }
})
export default class TemperatureTargets extends Mixins(StateMixin) {
  contextMenuState: any = {
    open: false,
    x: 0,
    y: 0,
    heater: null
  }

  heaterPidCalibrateDialog: any = {
    heater: null,
    open: false
  }

  heaterMpcCalibrateDialog: any = {
    heater: null,
    open: false
  }

  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans () {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get nevermore () {
    return this.$store.getters['printer/getOutputs'](['nevermore'])
  }

  get sensors () {
    return this.$store.getters['printer/getSensors']
  }

  get chartSelectedLegends (): ChartSelectedLegends {
    return this.$store.state.charts.selectedLegends
  }

  get chartData (): ChartData[] {
    return this.$store.state.charts.chart
  }

  get showRateOfChange (): boolean {
    return this.$store.state.config.uiSettings.general.showRateOfChange
  }

  get showRelativeHumidity (): boolean {
    return this.$store.state.config.uiSettings.general.showRelativeHumidity
  }

  get showBarometricPressure (): boolean {
    return this.$store.state.config.uiSettings.general.showBarometricPressure
  }

  get showGasResistance (): boolean {
    return this.$store.state.config.uiSettings.general.showGasResistance
  }

  setHeaterTargetTemp (heater: string, target: number) {
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${encodeGcodeParamValue(heater)} TARGET=${target}`)
  }

  setFanTargetTemp (fan: string, target: number) {
    this.sendGcode(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${encodeGcodeParamValue(fan)} TARGET=${target}`)
  }

  getRateOfChange (item: Heater | Sensor) {
    const recentChartData = this.chartData
      .slice(-5)
    const filteredChartData = takeRightWhile(recentChartData, x => x[item.key] != null)

    let rateOfChange = 0
    if (filteredChartData.length >= 2) {
      const curr = filteredChartData[filteredChartData.length - 1]
      const prev = filteredChartData[0]

      rateOfChange = (+curr[item.key] - +prev[item.key]) / (+curr.date - +prev.date) * 1000

      if (Math.abs(rateOfChange) < 0.05) {
        rateOfChange = 0 // prevent constant change of sign
      }
    }

    return `${rateOfChange < 0 ? '' : '+'}${rateOfChange.toFixed(1)}`
  }

  isLegendSelected (item: Heater | Fan, subKey?: string) {
    const key = `${item.key}${subKey ?? ''}`

    return this.chartSelectedLegends[key] ?? (subKey !== '#power' && subKey !== '#speed')
  }

  legendClick (item: Heater | Fan, subKey?: string) {
    const value = !this.isLegendSelected(item, subKey)
    const key = `${item.key}${subKey ?? ''}`

    const chartSelectedLegends: ChartSelectedLegends = {
      [key]: value
    }

    // If this has a target, toggle that too.
    if (
      !subKey &&
      'target' in item
    ) {
      chartSelectedLegends[`${item.key}#target`] = value
    }

    this.$emit('updateChartSelectedLegends', chartSelectedLegends)
  }

  getNevermoreSensors (item: Record<string, number | undefined>) {
    const sensors = [
      {
        key: 'gas',
        unit: '',
        digits: 0,
        small: false
      },
      {
        key: 'temperature',
        unit: ' °C',
        digits: 1,
        small: true
      }
    ]

    if (this.showRelativeHumidity) {
      sensors.push({
        key: 'humidity',
        unit: ' %',
        digits: 1,
        small: true
      })
    }

    if (this.showBarometricPressure) {
      sensors.push({
        key: 'pressure',
        unit: ' hPa',
        digits: 0,
        small: true
      })
    }

    return sensors
      .map(sensor => {
        const intake = item[`intake_${sensor.key}`]?.toFixed(sensor.digits)
        const intake_min = item[`intake_${sensor.key}_min`]?.toFixed(sensor.digits)
        const intake_max = item[`intake_${sensor.key}_max`]?.toFixed(sensor.digits)
        const exhaust = item[`exhaust_${sensor.key}`]?.toFixed(sensor.digits)
        const exhaust_min = item[`exhaust_${sensor.key}_min`]?.toFixed(sensor.digits)
        const exhaust_max = item[`exhaust_${sensor.key}_max`]?.toFixed(sensor.digits)

        return {
          ...sensor,
          intake,
          intake_min,
          intake_max,
          exhaust,
          exhaust_min,
          exhaust_max,
          disableTooltip: (
            intake_min == null &&
            intake_max == null &&
            exhaust_min == null &&
            exhaust_max == null
          )
        }
      })
  }

  handleHeaterRowClick (item: Heater, event: MouseEvent) {
    if (this.contextMenuState.open) {
      this.contextMenuState.open = false

      if (event.type !== 'contextmenu') {
        return
      }
    }

    // Open the context menu
    this.contextMenuState.x = event.clientX
    this.contextMenuState.y = event.clientY
    this.contextMenuState.heater = item
    this.$nextTick(() => {
      this.contextMenuState.open = true
    })
  }

  handleTurnOff (heater: Heater) {
    this.setHeaterTargetTemp(heater.name, 0)
  }

  handlePidCalibrateDialog (heater: Heater) {
    this.heaterPidCalibrateDialog = {
      heater,
      open: true
    }
  }

  handlePidCalibrate (heater: Heater, targetTemperature: number) {
    this.sendGcode(`PID_CALIBRATE HEATER=${encodeGcodeParamValue(heater.name)} TARGET=${targetTemperature}`)
  }

  handleMpcCalibrateDialog (heater: Heater) {
    this.heaterMpcCalibrateDialog = {
      heater,
      open: true
    }
  }

  handleMpcCalibrate (heater: Heater, targetTemperature: number, fanBreakpoints: NullableOrEmpty<number>) {
    this.sendGcode(`MPC_CALIBRATE HEATER=${encodeGcodeParamValue(heater.name)} TARGET=${targetTemperature}${!isNullOrEmpty(fanBreakpoints) ? ` FAN_BREAKPOINTS=${fanBreakpoints}` : ''}`)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .theme--light :deep(.v-data-table.temperature-table > .v-data-table__wrapper > table) {
    color: rgba(map-get($material-light, 'text-color'), 1);
    .temp-actual {
      color: rgba(map-get($material-light, 'text-color'), 1);
    }
  }

  .theme--dark :deep(.v-data-table.temperature-table > .v-data-table__wrapper > table) {
    color: rgba(map-get($material-dark, 'text-color'), 1);
    .temp-actual {
      color: rgba(map-get($material-dark, 'text-color'), 1);
    }
  }

  :deep(.v-data-table.temperature-table > .v-data-table__wrapper > table) {

    .temp-name,
    .temp-power {
      font-size: 1rem;
    }

    .temp-actual {
      font-weight: 300;
      font-size: 1.125rem;
      white-space: nowrap;
      text-align: right;
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
    opacity: 0.45
  }

  .legend-item.toggle {
    cursor: pointer;
  }

  .legend-item.active {
    opacity: 1
  }
</style>
