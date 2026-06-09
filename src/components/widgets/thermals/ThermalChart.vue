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
      :option="options"
      :update-options="updateOptions"
      :init-options="initOptions"
      autoresize
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
import type { ECharts, EChartsOption, LineSeriesOption } from 'echarts'
import getKlipperType from '@/util/get-klipper-type'
import BrowserMixin from '@/mixins/browser'
import type { ChartData, ChartSelectedLegends } from '@/store/charts/types'

@Component({})
export default class ThermalChart extends Mixins(BrowserMixin) {
  @Prop({ type: Boolean })
  readonly narrow?: boolean

  @Ref('chart')
  readonly chart!: ECharts

  // Stable references so component re-renders (e.g. toggling pause) don't cause
  // vue-echarts to dispose/re-init the chart or re-apply the options, both of
  // which would wipe the imperatively-set dataset and blank the chart.
  readonly updateOptions = Object.freeze({ notMerge: false })
  readonly initOptions = Object.freeze({ renderer: 'canvas' })

  loading = false
  paused = false
  series: LineSeriesOption[] = []
  initialSelected: Record<string, boolean> = {}

  togglePause () {
    this.paused = !this.paused

    if (!this.paused) {
      this.onDataChange(this.chartData)
    }
  }

  handleLegendSelectChanged (event: { selected: Record<string, boolean> }) {
    this.$typedDispatch('charts/saveSelectedLegends', event.selected)

    if (
      this.chart &&
      !this.loading
    ) {
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

  get chartData (): Readonly<ChartData>[] {
    return this.$typedState.charts.chart
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
    if (!this.chart || this.loading) return

    for (const series of this.series) {
      const baseKey = (series.name as string).replace(/(#target|#power|#speed)$/, '')
      const color = this.seriesColor(baseKey)
      series.color = color
      if (series.lineStyle) series.lineStyle.color = color
    }

    // Merge (no notMerge) so the imperatively-set dataset is preserved.
    this.chart.setOption({ series: this.series })
  }

  @Watch('chartData')
  onDataChange (data: any) {
    if (
      this.chart &&
      !this.loading &&
      !this.paused
    ) {
      this.chart.setOption({
        dataset: {
          source: data
        }
      })
    }
  }

  mounted () {
    this.init()
    this.loading = false
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    if (this.chart) {
      this.chart.dispose()
    }
  }

  init () {
    // Create the series and associated legends.
    const dataKeys = Object.keys(this.chartData[0])
    const keys = this.chartableSensors
    const series: LineSeriesOption[] = []

    keys.forEach((key) => {
      series.push(this.createSeries(key))

      if (dataKeys.includes(`${key}#target`)) {
        series.push(this.createSeries(key, '#target'))
      }

      if (dataKeys.includes(`${key}#power`)) {
        series.push(this.createSeries(key, '#power'))
      }

      if (dataKeys.includes(`${key}#speed`)) {
        series.push(this.createSeries(key, '#speed'))
      }
    })

    this.series = markRaw(series)
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
              if (
                param.seriesName &&
                !param.seriesName.endsWith('#target') &&
                !param.seriesName.endsWith('#power') &&
                !param.seriesName.endsWith('#speed') &&
                param.value[param.seriesName] != null
              ) {
                const name = param.seriesName.trim().split(/\s+/).pop() || ''
                text += `
                  <div>
                    ${param.marker}
                    <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                      ${this.$filters.prettyCase(name)}:
                    </span>
                    <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                      ${param.value[param.seriesName].toFixed(2)}<small>°C</small>`

                if (param.value[`${param.seriesName}#target`] != null) {
                  text += ` / ${param.value[`${param.seriesName}#target`].toFixed()}<small>°C</small>`
                }
                if (param.value[`${param.seriesName}#power`] != null) {
                  text += ` / ${(param.value[`${param.seriesName}#power`] * 100).toFixed()}<small>%</small>`
                }
                if (param.value[`${param.seriesName}#speed`] != null) {
                  text += ` / ${(param.value[`${param.seriesName}#speed`] * 100).toFixed()}<small>%</small>`
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

  createSeries (baseKey: string, subKey?: '#target' | '#power' | '#speed'): LineSeriesOption {
    // Grab the color
    const key = `${baseKey}${subKey ?? ''}`
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
    if (subKey === '#target') {
      series.yAxisIndex = 0
      series.lineStyle!.width = 1
      series.lineStyle!.type = 'dashed'
      series.lineStyle!.opacity = 0.8
      series.areaStyle!.opacity = 0
    }

    // If this is a power or speed, adjust its display.
    if (subKey === '#power' || subKey === '#speed') {
      series.yAxisIndex = 1
      series.lineStyle!.width = 1
      series.lineStyle!.type = 'dotted'
      series.lineStyle!.opacity = 1
      series.areaStyle!.opacity = 0
    }

    // Set the initial legend state (power and speed default off)
    this.initialSelected[key] = this.chartSelectedLegends[key] ?? (subKey !== '#power' && subKey !== '#speed')

    // Push the series into our options object.
    return series
  }

  showPowerAxis (selected: Record<string, boolean>) {
    return Object.keys(selected)
      .some(key =>
        (
          key.endsWith('#power') ||
          key.endsWith('#speed')
        ) &&
        selected[key] === true
      )
  }

  highlightSeries (key: string) {
    if (this.chart && !this.loading) {
      const seriesName = this.series
        .map(series => series.name as string)
        .filter(name => name === key || name.startsWith(`${key}#`))

      this.chart.dispatchAction({ type: 'downplay' })
      this.chart.dispatchAction({ type: 'highlight', seriesName })
    }
  }

  downplaySeries () {
    if (this.chart && !this.loading) {
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
