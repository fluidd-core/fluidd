<template>
  <v-container>
    <v-row
      v-for="sensor in sensors"
      :key="sensor.id"
    >
      <v-col>
        <v-simple-table class="sensor-table">
          <thead>
            <tr>
              <th width="100%">
                {{ $t('app.chart.label.item') }}
              </th>
              <th
                v-for="key in getValueKeys(sensor)"
                :key="`${sensor.id}-${key}`"
              >
                {{ $filters.prettyCase(key) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="sensor-name">
                {{ $filters.prettyCase(sensor.friendly_name) }}
              </td>
              <td
                v-for="key in getValueKeys(sensor)"
                :key="`${sensor.id}-${key}-value`"
                class="sensor-value"
              >
                <span
                  :class="{ 'active': isLegendSelected(sensor, key), 'toggle': isChartableValue(sensor, key) }"
                  class="legend-item"
                  @click="handleLegendClick(sensor, key)"
                >
                  {{ getFormattedValue(sensor, key, sensor.values[key]) }}
                </span>
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <template v-if="hasChart(sensor)">
          <v-divider />

          <app-chart
            class="sensor-chart"
            :data="getChartData(sensor)"
            :dimensions="getChartDimensions(sensor)"
            height="260px"
            :options="getChartOptions(sensor)"
          />
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import type { ChartData } from '@/store/charts/types'

interface SensorSeries extends LineSeriesOption {
  unit?: string
}

@Component({})
export default class Sensors extends Vue {
  selectedLegends: Record<string, boolean> = {}

  get sensors (): Moonraker.Sensor.Entry[] {
    return this.$typedGetters['sensors/getSensors']
  }

  getFormattedValue (sensor: Moonraker.Sensor.Entry, key: string, value: unknown) {
    if (value == null || value === '') {
      return '--'
    }

    const parameterUnits = sensor.parameter_info?.find(x => x.name === key)?.units
    const units = parameterUnits
      ? ` ${parameterUnits}`
      : ''

    if (typeof value === 'number') {
      return `${Math.round(value * 100) / 100}${units}`
    }

    return `${value}${units}`
  }

  getValueKeys (sensor: Moonraker.Sensor.Entry): string[] {
    return Object.keys(sensor.values)
  }

  hasChart (sensor: Moonraker.Sensor.Entry): boolean {
    return this.getChartData(sensor).length > 0 && this.getChartDimensions(sensor).length > 1
  }

  isChartableValue (sensor: Moonraker.Sensor.Entry, key: string): boolean {
    return typeof sensor.values[key] === 'number'
  }

  isLegendSelected (sensor: Moonraker.Sensor.Entry, key: string): boolean {
    return this.selectedLegends[this.getLegendKey(sensor, key)] ?? true
  }

  handleLegendClick (sensor: Moonraker.Sensor.Entry, key: string) {
    if (!this.isChartableValue(sensor, key)) {
      return
    }

    this.$set(
      this.selectedLegends,
      this.getLegendKey(sensor, key),
      !this.isLegendSelected(sensor, key)
    )
  }

  getChartData (sensor: Moonraker.Sensor.Entry): Readonly<ChartData>[] {
    return this.$typedState.charts[this.getChartKey(sensor)] ?? []
  }

  getChartDimensions (sensor: Moonraker.Sensor.Entry): string[] {
    return [
      'date',
      ...Object.entries(sensor.values)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
        .map(([key]) => key)
    ]
  }

  getChartOptions (sensor: Moonraker.Sensor.Entry): EChartsOption {
    const isDark: boolean = this.$typedState.config.uiSettings.theme.isDark
    const fontColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const lineColor = isDark ? '#ffffff' : '#000000'
    const lineStyle = {
      color: lineColor,
      opacity: 0.05
    }
    const pointerStyle = {
      color: lineColor,
      opacity: 0.5
    }

    const series = this.getChartSeries(sensor)
    const axisUnit = this.getPrimaryUnit(sensor)
    const axisName = axisUnit
      ? `${this.$filters.prettyCase(this.getPrimaryDimension(sensor) ?? '')} ${axisUnit}`
      : this.$filters.prettyCase(sensor.friendly_name)

    return {
      dataset: {
        dimensions: this.getChartDimensions(sensor),
        source: this.getChartData(sensor)
      },
      grid: {
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        outerBoundsMode: 'same',
        outerBoundsContain: 'auto'
      },
      textStyle: {
        fontFamily: 'Roboto'
      },
      legend: {
        show: false
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)',
        borderColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
        textStyle: {
          color: fontColor,
          fontFamily: 'Roboto',
          fontSize: 13
        },
        axisPointer: {
          type: 'line',
          lineStyle: pointerStyle,
          label: {
            color: fontColor,
            fontSize: 14,
            backgroundColor: isDark ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)'
          }
        },
        position: (pos, params, el, elRect, size) => {
          const obj: Record<string, number> = { top: -10 }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 10
          return obj
        },
        formatter: (params) => this.formatTooltip(params, series)
      },
      xAxis: {
        type: 'time',
        max: 'dataMax',
        min: (value: { max: number }) => {
          const retention: number = this.$typedGetters['charts/getChartRetention']
          return value.max - (retention * 1000)
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle
        },
        axisLabel: {
          margin: 14,
          color: fontColor,
          fontSize: 14,
          formatter: '{H}:{mm}',
          rotate: 0
        },
        axisPointer: {
          label: {
            show: true,
            margin: 9,
            formatter: (params) => this.$filters.formatTimeWithSeconds(params.value)
          }
        }
      },
      yAxis: {
        name: axisName,
        nameTextStyle: {
          fontSize: 14,
          color: fontColor,
          align: 'left'
        },
        nameGap: 8,
        show: true,
        type: 'value',
        position: 'left',
        scale: true,
        splitLine: {
          show: true,
          lineStyle
        },
        axisLabel: {
          margin: 8,
          fontSize: 14,
          color: fontColor
        },
        boundaryGap: [0, '100%']
      },
      dataZoom: [{
        type: 'inside',
        zoomOnMouseWheel: 'shift'
      }],
      series
    }
  }

  getChartSeries (sensor: Moonraker.Sensor.Entry): SensorSeries[] {
    return this.getChartDimensions(sensor)
      .filter(key => key !== 'date')
      .filter(key => this.isLegendSelected(sensor, key))
      .map(key => ({
        name: this.$filters.prettyCase(key),
        unit: sensor.parameter_info?.find(x => x.name === key)?.units ?? '',
        type: 'line',
        showSymbol: false,
        animation: false,
        emphasis: {
          focus: 'series'
        },
        lineStyle: {
          width: 1.5,
          opacity: 1
        },
        areaStyle: {
          opacity: key === this.getPrimaryDimension(sensor) ? 0.05 : 0
        },
        encode: {
          x: 'date',
          y: key
        }
      }))
  }

  getChartKey (sensor: Moonraker.Sensor.Entry): string {
    return `sensor:${sensor.id}`
  }

  getLegendKey (sensor: Moonraker.Sensor.Entry, key: string): string {
    return `${sensor.id}:${key}`
  }

  getPrimaryDimension (sensor: Moonraker.Sensor.Entry): string | undefined {
    const dimensions = this.getChartDimensions(sensor)
      .filter(key => key !== 'date')

    return dimensions.includes('power')
      ? 'power'
      : dimensions[0]
  }

  getPrimaryUnit (sensor: Moonraker.Sensor.Entry): string {
    const primaryDimension = this.getPrimaryDimension(sensor)

    return primaryDimension
      ? sensor.parameter_info?.find(x => x.name === primaryDimension)?.units ?? ''
      : ''
  }

  formatTooltip (params: unknown, series: SensorSeries[]): string {
    if (!Array.isArray(params)) {
      return ''
    }

    return params
      .map((param) => {
        if (
          param == null ||
          typeof param !== 'object' ||
          !('seriesIndex' in param) ||
          !('data' in param) ||
          !('marker' in param)
        ) {
          return ''
        }

        const seriesIndex = Number(param.seriesIndex)
        const item = series[seriesIndex]
        const key = item?.encode?.y

        if (typeof key !== 'string' || item == null) {
          return ''
        }

        const data = param.data as Record<string, unknown>
        const value = data[key]
        const formattedValue = typeof value === 'number'
          ? Math.round(value * 1000) / 1000
          : '-'

        return `
          <div>
            ${String(param.marker)}
            <span>${this.sanitize(String(item.name))}:</span>
            <strong style="float:right;margin-left:20px">
              ${this.sanitize(String(formattedValue))} ${this.sanitize(item.unit ?? '')}
            </strong>
            <div style="clear:both"></div>
          </div>`
      })
      .join('')
  }

  sanitize (value: string): string {
    return value.replace(/[^\w .-]/g, (char: string) => `&#${char.charCodeAt(0)};`)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .theme--light :deep(.v-data-table.sensor-table > .v-data-table__wrapper > table) {
    color: rgba(map-get($material-light, 'text-color'), 1);
  }

  .theme--dark :deep(.v-data-table.sensor-table > .v-data-table__wrapper > table) {
    color: rgba(map-get($material-dark, 'text-color'), 1);
  }

  :deep(.v-data-table.sensor-table > .v-data-table__wrapper > table) {
    > thead > tr > th {
      height: 40px;
      white-space: nowrap;
    }

    > thead > tr > th:first-child,
    > tbody > tr > td:first-child {
      padding-left: 16px;
    }

    > thead > tr > th:not(:first-child),
    > tbody > tr > td:not(:first-child) {
      text-align: right;
    }
  }

  .sensor-name {
    font-size: 1rem;
  }

  .sensor-chart {
    width: 100%;
  }

  .sensor-value {
    font-weight: 300;
    font-size: 1.125rem;
    white-space: nowrap;
  }

  .legend-item {
    display: inline-block;
    opacity: 0.45;
  }

  .legend-item.toggle {
    cursor: pointer;
  }

  .legend-item.active {
    opacity: 1;
  }
</style>
