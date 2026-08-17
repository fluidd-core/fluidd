<template>
  <div
    class="chart"
    :style="{
      height: $filters.getPixelsString(isMobileViewport ? 180 : 260)
    }"
  >
    <e-chart
      ref="chart"
      style="overflow: initial;"
      manual-update
      :init-options="initOptions"
      autoresize
      @hook:mounted="onChartReady"
      @legendselectchanged="handleLegendSelectChanged"
      @legendselected="handleLegendSelectChanged"
      @legendunselected="handleLegendSelectChanged"
    />

    <div class="chart-options">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            icon
            small
            tabindex="-1"
            v-on="on"
            @click="togglePause"
          >
            <v-icon>{{ paused ? '$resume' : '$pause' }}</v-icon>
          </v-btn>
        </template>
        <span>{{ paused ? $t('app.general.btn.resume') : $t('app.general.btn.pause') }}</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang='ts'>
import { markRaw } from 'vue'
import { Component, Watch, Prop, Ref, Mixins } from 'vue-property-decorator'
import type { ECharts, EChartsInitOpts, EChartsOption, LineSeriesOption } from 'echarts'
import getKlipperType from '@/util/get-klipper-type'
import { smoothChartSource } from '@/util/chart-smoothing'
import type { ChartBuffer, ChartDataSource } from '@/store/charts/types'
import { tooltipValueByDimension } from '@/util/chart-tooltip'
import { isDutyCycleSubKey, parseThermalColumn, thermalColumn, thermalSubKeys } from '@/store/charts/thermal-columns'
import type { ThermalSubKey } from '@/store/charts/thermal-columns'
import BrowserMixin from '@/mixins/browser'
import type { ChartSelectedLegends } from '@/store/charts/types'

@Component({})
export default class ThermalChart extends Mixins(BrowserMixin) {
  @Prop({ type: Boolean })
  readonly narrow?: boolean

  @Ref('chart')
  readonly chart?: ECharts

  // Stable reference so re-renders don't make vue-echarts re-init the chart.
  readonly initOptions: EChartsInitOpts = Object.freeze({ renderer: 'canvas' })

  paused = false
  series: LineSeriesOption[] = []
  initialSelected: Record<string, boolean> = {}

  togglePause () {
    this.paused = !this.paused

    if (!this.paused) {
      this.onDataChange()
    }
  }

  handleLegendSelectChanged (event: { selected: Record<string, boolean> }) {
    this.initialSelected = event.selected
    this.$typedDispatch('charts/saveSelectedLegends', event.selected)

    if (this.chart) {
      const show = this.showPowerAxis(event.selected)

      this.chart.setOption({
        yAxis: [
          {},
          {
            show,
            axisLabel: { show }
          }
        ]
      })
    }
  }

  get thermalChartBuffer (): ChartBuffer {
    return this.$typedState.charts.thermal
  }

  // Vue 2 doesn't observe typed array writes - `revision` is the signal.
  get chartRevision (): number {
    return this.thermalChartBuffer.revision
  }

  get chartSmoothingWindow (): number {
    return this.$typedState.config.uiSettings.general.chartSmoothingWindow
  }

  // Only temperatures are noisy; targets and duty cycles are exact.
  get smoothableKeys (): string[] {
    return this.seriesNames
      .filter(name => parseThermalColumn(name).sub == null)
  }

  get seriesNames (): string[] {
    return this.series
      .map(series => series.name as string)
  }

  get smoothedChartData (): ChartDataSource {
    return smoothChartSource(
      this.thermalChartBuffer,
      this.smoothableKeys,
      this.chartSmoothingWindow
    )
  }

  get chartableSensors (): string[] {
    return this.$typedGetters['printer/getChartableSensors']
  }

  get chartSelectedLegends (): ChartSelectedLegends {
    return this.$typedState.charts.selectedLegends
  }

  get sensorColors (): Record<string, string> {
    return this.$typedState.config.uiSettings.dashboard.sensorColors
  }

  @Watch('sensorColors', { deep: true })
  onSensorColorsChange () {
    if (!this.chart) return

    for (const series of this.series) {
      const baseKey = parseThermalColumn(series.name as string).sensor
      const color = this.seriesColor(baseKey)

      series.color = color

      if (series.lineStyle) {
        series.lineStyle.color = color
      }
    }

    // Merge (no notMerge) so the imperatively-set dataset is preserved.
    this.chart.setOption({ series: this.series })
  }

  // Watch the raw inputs so the paused check below can skip smoothing work.
  @Watch('chartRevision')
  @Watch('chartSmoothingWindow')
  onDataChange () {
    if (
      !this.chart ||
      this.paused
    ) {
      return
    }

    const seriesCount = this.series.length

    this.initSeries()

    if (seriesCount === 0) {
      // Series deferred at creation (empty store): build now and re-apply.
      if (this.series.length > 0) {
        this.onChartReady()
      }

      return
    }

    if (this.series.length > seriesCount) {
      // Merge (no notMerge) so zoom/legend state isn't dropped.
      this.chart.setOption({
        series: this.series,
        legend: { selected: this.initialSelected }
      })
    }

    this.chart.setOption({
      dataset: {
        source: this.smoothedChartData
      }
    })
  }

  // Merge so the imperatively-set dataset and legend selection are preserved.
  @Watch('options')
  onOptionsChange (options: EChartsOption) {
    if (!this.chart) {
      return
    }

    this.chart.setOption(options)
  }

  created () {
    this.initSeries()
  }

  // Builds series for any chartable column that has data but no series yet.
  initSeries () {
    const dataKeys = new Set(this.thermalChartBuffer.columns.keys())
    const existing = new Set(this.seriesNames)
    const newSeries: LineSeriesOption[] = []

    const addSeries = (key: string, sub?: ThermalSubKey) => {
      const column = thermalColumn(key, sub)

      if (dataKeys.has(column) && !existing.has(column)) {
        newSeries.push(this.createSeries(key, sub))
        existing.add(column)
      }
    }

    this.chartableSensors.forEach((key) => {
      addSeries(key)

      for (const sub of thermalSubKeys) {
        addSeries(key, sub)
      }
    })

    if (newSeries.length > 0) {
      this.series = markRaw([...this.series, ...newSeries])
    }
  }

  // Apply the full options + current data once the chart is ready.
  onChartReady () {
    if (!this.chart) return

    this.chart.setOption({
      ...this.options,
      dataset: {
        source: this.smoothedChartData
      }
    }, { notMerge: true })
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    this.chart?.dispose()
  }

  get options (): EChartsOption {
    const isDark: boolean = this.$typedState.config.uiSettings.theme.isDark

    const fontColor = (isDark) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const fontSize = (this.isMobileViewport || this.narrow) ? 13 : 14

    const lineStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.05
    }

    const pointerStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.5
    }

    const tooltip: EChartsOption['tooltip'] = {
      backgroundColor: (isDark) ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)',
      borderColor: (isDark) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
      textStyle: {
        color: fontColor,
        fontSize
      }
    }

    const theme = this.$vuetify.theme.currentTheme
    const color: EChartsOption['color'] = [
      theme.primary?.toString() ?? '',
      theme.secondary?.toString() ?? ''
    ]
    const margin = (
      this.isMobileViewport ||
      this.narrow
    )
      ? 12
      : 16

    const options: EChartsOption = {
      grid: {
        top: margin,
        left: margin,
        right: margin,
        bottom: margin,
        outerBoundsMode: 'same',
        outerBoundsContain: 'auto'
      },
      textStyle: {
        fontFamily: 'Roboto'
      },
      color,
      legend: {
        show: false,
        selected: this.initialSelected
      },
      tooltip: {
        ...tooltip,
        trigger: 'axis',
        confine: false,
        axisPointer: {
          type: 'line',
          lineStyle: pointerStyle,
          label: {
            color: fontColor,
            fontSize,
            backgroundColor: tooltip.backgroundColor
          }
        },
        position: (pos, params, el, elRect, size) => {
          const obj: Record<string, any> = { top: -10 }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 10
          return obj
        },
        formatter: (params) => {
          if (!Array.isArray(params)) {
            return ''
          }

          let text = ''
          params
            .forEach((param: any) => {
              const sub = param.seriesName ? parseThermalColumn(param.seriesName).sub : undefined

              if (
                param.seriesName &&
                sub == null
              ) {
                const valueAt = (name: string) => tooltipValueByDimension(param, name)

                const temperature = valueAt(param.seriesName)
                if (temperature == null) return

                const name = param.seriesName.trim().split(/\s+/).pop() || ''
                text += `
                  <div>
                    ${param.marker}
                    <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                      ${this.$filters.prettyCase(name)}:
                    </span>
                    <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                      ${temperature.toFixed(2)}<small>°C</small>`

                const target = valueAt(thermalColumn(param.seriesName, 'target'))
                if (target != null) {
                  text += ` / ${target.toFixed()}<small>°C</small>`
                }
                const power = valueAt(thermalColumn(param.seriesName, 'power'))
                if (power != null) {
                  text += ` / ${(power * 100).toFixed()}<small>%</small>`
                }
                const speed = valueAt(thermalColumn(param.seriesName, 'speed'))
                if (speed != null) {
                  text += ` / ${(speed * 100).toFixed()}<small>%</small>`
                }
                text += `</span>
                  <div style="clear: both"></div>
                </div>
                <div style="clear: both"></div>`
              }
            })
          return text
        }
      },
      xAxis: {
        type: 'time',
        max: 'dataMax',
        min: (value: any) => {
          const temperature_store_size: number = this.$typedGetters['charts/getChartRetention']
          return value.max - (temperature_store_size * 1000)
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
          color: tooltip.textStyle?.color,
          fontSize,
          formatter: '{H}:{mm}',
          rotate: (this.isMobileViewport || this.narrow) ? 45 : 0
        },
        axisPointer: {
          label: {
            show: true,
            margin: 9,
            formatter: (params) => this.$filters.formatTimeWithSeconds(params.value)
          }
        }
      },
      yAxis: [
        {
          name: 'Temperature °C',
          nameTextStyle: {
            fontSize,
            color: fontColor,
            align: 'left'
          },
          nameGap: 8,
          show: true,
          type: 'value',
          position: 'left',
          splitLine: { show: true, lineStyle },
          minInterval: 20,
          maxInterval: 60,
          min: (extent) => {
            const min = Math.floor(extent.min / 10) * 10

            return min === extent.min && (min - 10) >= 0
              ? min - 10
              : min
          },
          max: (extent) => {
            const max = Math.ceil(extent.max / 10) * 10

            return max === extent.max
              ? max + 10
              : max
          },
          axisLabel: {
            margin: 8,
            color: fontColor,
            fontSize,
            formatter: '{value}'
          },
          boundaryGap: [0, '100%']
        },
        {
          name: 'Power %',
          nameTextStyle: {
            fontSize,
            color: fontColor,
            align: 'right'
          },
          nameGap: 8,
          show: this.showPowerAxis(this.initialSelected),
          type: 'value',
          position: 'right',
          splitLine: { show: false, lineStyle },
          min: 0,
          max: 1,
          axisLabel: {
            show: this.showPowerAxis(this.initialSelected),
            margin: 8,
            color: fontColor,
            fontSize,
            formatter: (value) => `${value * 100}`
          },
          boundaryGap: [0, '100%']
        }
      ],
      dataZoom: [{
        type: 'inside',
        zoomOnMouseWheel: 'shift'
      }],
      series: this.series
    }

    return options
  }

  seriesColor (baseKey: string): string {
    return this.$colorset.next(getKlipperType(baseKey), baseKey, this.sensorColors[baseKey])
  }

  createSeries (baseKey: string, subKey?: ThermalSubKey): LineSeriesOption {
    // Grab the color
    const key = thermalColumn(baseKey, subKey)
    const color = this.seriesColor(baseKey)

    // Base properties
    const series: LineSeriesOption = {
      name: key,
      // id,
      type: 'line',
      yAxisIndex: 0,
      showSymbol: false,
      animation: false,
      color,
      emphasis: {
        focus: 'series'
      },
      lineStyle: {
        color,
        type: 'solid',
        width: 1.5,
        opacity: 1
      },
      areaStyle: {
        opacity: 0.05
      },
      encode: {
        x: 'date',
        y: key
      }
    }

    // If this is a target, adjust its display.
    if (subKey === 'target') {
      series.yAxisIndex = 0
      series.lineStyle!.width = 1
      series.lineStyle!.type = 'dashed'
      series.lineStyle!.opacity = 0.8
      series.areaStyle!.opacity = 0
    }

    // If this is a power or speed, adjust its display.
    if (isDutyCycleSubKey(subKey)) {
      series.yAxisIndex = 1
      series.lineStyle!.width = 1
      series.lineStyle!.type = 'dotted'
      series.lineStyle!.opacity = 1
      series.areaStyle!.opacity = 0
    }

    // Set the initial legend state (power and speed default off)
    this.initialSelected[key] = this.chartSelectedLegends[key] ?? !isDutyCycleSubKey(subKey)

    // Push the series into our options object.
    return series
  }

  showPowerAxis (selected: Record<string, boolean>) {
    return Object.keys(selected)
      .some(key =>
        selected[key] === true &&
        isDutyCycleSubKey(parseThermalColumn(key).sub)
      )
  }

  highlightSeries (key: string) {
    if (this.chart) {
      const seriesName = this.seriesNames
        .filter(name => parseThermalColumn(name).sensor === key)

      this.chart.dispatchAction({ type: 'downplay' })
      this.chart.dispatchAction({ type: 'highlight', seriesName })
    }
  }

  downplaySeries () {
    if (this.chart) {
      this.chart.dispatchAction({ type: 'downplay' })
    }
  }

  updateChartSelectedLegends (chartSelectedLegends: ChartSelectedLegends) {
    if (this.chart) {
      const entries = Object.entries(chartSelectedLegends)
      let index = entries.length

      for (const [name, value] of entries) {
        // only raise events for the last change
        const silent = --index !== 0

        this.chart.dispatchAction({
          type: value
            ? 'legendSelect'
            : 'legendUnSelect',
          name
        }, {
          silent
        })
      }
    }
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    position: relative;
    width: 100%;
  }

  .chart-options {
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px 0px;
    margin-right: 16px;
    z-index: 1;
  }
</style>
