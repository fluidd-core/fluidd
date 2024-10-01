<template>
  <div
    class="chart"
    :style="{ 'height': height }"
  >
    <e-chart
      ref="chart"
      style="overflow: initial;"
      :option="options"
      :update-options="{ notMerge: true }"
      :init-options="{ renderer: 'svg' }"
      autoresize
      @legendselectchanged="handleLegendSelectChanged"
    />
  </div>
</template>

<script lang='ts'>
import { Component, Watch, Prop, Ref, Mixins } from 'vue-property-decorator'
import type { ECharts, EChartsOption } from 'echarts'
import getKlipperType from '@/util/get-klipper-type'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class ThermalChart extends Mixins(BrowserMixin) {
  @Prop({ type: String, default: '100%' })
  readonly height!: string

  @Ref('chart')
  readonly chart!: ECharts

  loading = false
  series: any[] = []
  initialSelected: Record<string, boolean> = {}

  handleLegendSelectChanged (event: { selected: Record<string, boolean> }) {
    this.$store.dispatch('charts/saveSelectedLegends', event.selected)

    let right = (this.isMobileViewport) ? 15 : 20
    if (this.showPowerAxis(event.selected)) {
      right = (this.isMobileViewport) ? 25 : 45
    }

    if (
      this.chart &&
      !this.loading
    ) {
      this.chart.setOption({
        grid: { right },
        yAxis: [
          {},
          { show: this.showPowerAxis(event.selected) }
        ]
      })
    }
  }

  get chartData () {
    return this.$store.getters['charts/getChartData']
  }

  @Watch('chartData')
  onDataChange (data: any) {
    if (this.chart && !this.loading) {
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
    const keys = this.$store.getters['printer/getChartableSensors'] as string[]

    keys.forEach((key) => {
      this.series.push(this.createSeries(key))
      if (dataKeys.includes(`${key}Target`)) this.series.push(this.createSeries(`${key}Target`))
      if (dataKeys.includes(`${key}Power`)) this.series.push(this.createSeries(`${key}Power`))
      if (dataKeys.includes(`${key}Speed`)) this.series.push(this.createSeries(`${key}Speed`))
    })
  }

  get options () {
    const isDark = this.$store.state.config.uiSettings.theme.isDark

    const fontColor = (isDark) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const fontSize = (this.isMobileViewport) ? 13 : 14

    const lineStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.05
    }

    const pointerStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.5
    }

    let right = (this.isMobileViewport) ? 15 : 20
    if (this.showPowerAxis(this.initialSelected)) {
      right = (this.isMobileViewport) ? 35 : 45
    }
    const grid = {
      top: 20,
      left: (this.isMobileViewport) ? 35 : 45,
      right,
      bottom: (this.isMobileViewport) ? 52 : 38
    }

    const tooltip = {
      backgroundColor: (isDark) ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)',
      borderColor: (isDark) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
      textStyle: {
        color: fontColor,
        fontSize
      }
    }

    const theme = this.$vuetify.theme.currentTheme
    const color = [
      theme.primary,
      theme.secondary
    ]

    const options = {
      grid,
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
        position: this.tooltipPosition,
        formatter: (params: any) => {
          let text = ''
          params
            .forEach((param: any) => {
              if (
                !param.seriesName.toLowerCase().endsWith('target') &&
                !param.seriesName.toLowerCase().endsWith('power') &&
                !param.seriesName.toLowerCase().endsWith('speed') &&
                param.seriesName &&
                param.value[param.seriesName] != null
              ) {
                const name = param.seriesName.split(' ', 2).pop()
                text += `
                  <div>
                    ${param.marker}
                    <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                      ${this.$filters.prettyCase(name)}:
                    </span>
                    <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                      ${param.value[param.seriesName].toFixed(2)}<small>°C</small>`

                if (param.seriesName + 'Target' in param.value) {
                  text += ` / ${param.value[param.seriesName + 'Target'].toFixed()}<small>°C</small>`
                }
                if (param.seriesName + 'Power' in param.value) {
                  text += ` / ${(param.value[param.seriesName + 'Power'] * 100).toFixed()}<small>%</small>`
                }
                if (param.seriesName + 'Speed' in param.value) {
                  text += ` / ${(param.value[param.seriesName + 'Speed'] * 100).toFixed()}<small>%</small>`
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
        boundaryGap: false,
        max: 'dataMax',
        min: (value: any) => {
          const temperature_store_size = this.$store.getters['charts/getChartRetention']
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
          interval: 0,
          margin: 14,
          color: tooltip.textStyle.color,
          fontSize,
          formatter: '{H}:{mm}',
          rotate: (this.isMobileViewport) ? 45 : 0
        },
        axisPointer: {
          label: {
            show: true,
            margin: 9,
            formatter: this.xAxisPointerFormatter
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
          min: this.yAxisTempMin,
          max: this.yAxisTempMax,
          axisLabel: {
            interval: 0,
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
            interval: 0,
            margin: 8,
            color: fontColor,
            fontSize,
            formatter: this.yAxisPowerFormatter
          },
          boundaryGap: [0, '100%']
        }
      ],
      dataZoom: [{
        type: 'inside',
        zoomOnMouseWheel: 'shift'
      }],
      series: this.series
    } as EChartsOption

    return options
  }

  createSeries (key: string) {
    // Grab the color
    const color = this.$colorset.next(getKlipperType(key), key)

    // Base properties
    const series: any = {
      name: key,
      // id,
      type: 'line',
      yAxisIndex: 0,
      showSymbol: false,
      animation: false,
      color,
      emphasis: {
        lineStyle: {
          width: 1.5
        }
      },
      lineStyle: {
        color,
        type: 'solid',
        width: 1.5,
        opacity: 1
      },
      areaStyle: { opacity: 0.05 },
      encode: { x: 'date', y: key }
    }

    // If this is a target, adjust its display.
    if (key.toLowerCase().endsWith('target')) {
      series.yAxisIndex = 0
      series.emphasis.lineStyle.width = 1
      series.lineStyle.width = 1
      series.lineStyle.type = 'dashed'
      series.lineStyle.opacity = 0.8
      series.areaStyle.opacity = 0
    }

    // If this is a power or speed, adjust its display.
    if (
      key.toLowerCase().endsWith('power') ||
      key.toLowerCase().endsWith('speed')
    ) {
      series.yAxisIndex = 1
      series.emphasis.lineStyle.width = 1
      series.lineStyle.width = 1
      series.lineStyle.type = 'dotted'
      series.lineStyle.opacity = 1
      series.areaStyle.opacity = 0
    }

    // Set the initial legend state (power and speed default off)
    const storedLegends = this.$store.getters['charts/getSelectedLegends']
    if (storedLegends[key] !== undefined) {
      this.initialSelected[key] = storedLegends[key]
    } else {
      this.initialSelected[key] = !(
        key.toLowerCase().endsWith('power') ||
        key.toLowerCase().endsWith('speed')
      )
    }

    // Push the series into our options object.
    return series
  }

  showPowerAxis (selected: Record<string, boolean>) {
    const filtered = Object.keys(selected)
      .filter(key => key.toLowerCase().endsWith('power') || key.toLowerCase().endsWith('speed'))
      .filter(key => selected[key] === true)

    return (filtered.length > 0)
  }

  legendToggleSelect (name: string) {
    if (this.chart) {
      this.chart.dispatchAction({
        type: 'legendToggleSelect',
        name
      })
    }
  }

  tooltipPosition (pos: any, params: any, el: HTMLElement, elRect: any, size: any) {
    const obj: { [index: string]: any } = { top: -10 }
    obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 10
    return obj
  }

  xAxisPointerFormatter (params: any) {
    return this.$filters.formatTimeWithSeconds(params.value)
  }

  yAxisPointerFormatter (params: any) {
    return params.value.toFixed() + '°C'
  }

  yAxisPowerFormatter (value: any) {
    return `${value * 100}`
  }

  yAxisTempMin (value: any) {
    let num1 = Math.floor(value.min / 10) * 10
    num1 = (num1 === value.min && (num1 - 10) >= 0)
      ? num1 - 10
      : num1
    return num1
  }

  yAxisTempMax (value: any) {
    let num1 = Math.ceil(value.max / 10) * 10
    num1 = (num1 === value.max)
      ? num1 + 10
      : num1
    return num1
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    margin-top: 16px;
    width: 100%;
    // height: 325px;
  }
</style>
