<template>
  <div class="chart">
    <ECharts ref="chart" :option="options" :initOpts="{ renderer: 'svg' }"></ECharts>
  </div>
</template>

<script lang='ts'>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ECharts, EChartsOption } from 'echarts'
import { getKlipperType } from '@/store/helpers'
import { ChartSelectedLegends } from '@/store/config/types'

@Component({})
export default class EChartsWidget extends Vue {
  @Prop({ required: true, default: {} })
  public chartData!: any

  ready = false
  series: EChartsOption[] = []
  legends: any = []

  get selectedLegends () {
    return this.$store.state.config.appState.chartSelectedLegends
  }

  set selectedLegends (value: ChartSelectedLegends) {
    this.$store.dispatch('config/saveGeneric', { key: 'appState.chartSelectedLegends', value })
  }

  get chart () {
    const ref = this.$refs.chart as any
    if (ref) return ref.inst as ECharts
  }

  get options () {
    const darkMode = this.$store.state.config.fileConfig.general.darkMode
    const fontSize = 16
    const lineOpacity = 0.2
    let labelBackground = 'rgba(10,10,10,0.90)'
    let fontColor = 'rgba(255,255,255,0.25)'
    let lineColor = '#ffffff'
    if (!darkMode) {
      labelBackground = 'rgba(255,255,255,0.90)'
      fontColor = 'rgba(0,0,0,0.45)'
      lineColor = '#000000'
    }

    const options: EChartsOption & any = {
      grid: {
        top: 10,
        left: 70,
        right: 70,
        bottom: 50
      },
      legend: {
        show: false,
        top: 0,
        icon: 'circle',
        textStyle: {
          fontSize,
          color: fontColor
        },
        selected: this.selectedLegends,
        data: this.legends
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: labelBackground,
        borderColor: labelBackground,
        textStyle: {
          color: fontColor,
          fontSize
        },
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: lineColor,
            opacity: lineOpacity
          },
          label: {
            color: fontColor,
            fontSize,
            backgroundColor: labelBackground
          }
        },
        position: this.tooltipPosition,
        formatter: this.tooltipFormatter
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: lineColor,
            opacity: 0.05
          }
        },
        axisLabel: {
          interval: 0,
          margin: 14,
          color: fontColor,
          fontSize,
          formatter: '{hh}:{mm}'
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
          type: 'value',
          position: 'left',
          splitLine: {
            show: true,
            lineStyle: {
              color: lineColor,
              opacity: 0.05
            }
          },
          minInterval: 20,
          maxInterval: 60,
          min: 0,
          max: this.yAxisTempMax,
          axisLabel: {
            interval: 0,
            margin: 14,
            color: fontColor,
            fontSize,
            formatter: '{value}°C'
          },
          boundaryGap: [0, '100%']
        },
        {
          type: 'value',
          position: 'right',
          splitLine: {
            show: true,
            lineStyle: {
              color: lineColor,
              opacity: 0.05
            }
          },
          min: 0,
          max: 1,
          axisLabel: {
            interval: 0,
            margin: 14,
            color: fontColor,
            fontSize,
            formatter: this.yAxisPowerFormatter
          },
          boundaryGap: [0, '100%']
        }
      ],
      dataset: {
        source: this.chartData
      },
      series: this.series
    }
    return options
  }

  mounted () {
    this.init()
    this.ready = true
  }

  destroy () {
    if (this.chart) {
      this.chart.dispose()
    }
  }

  init () {
    // Create the series and associated legends.
    const dataKeys = Object.keys(this.chartData[0])
    const keys = this.$store.getters['socket/getChartableSensors'] as string[]

    keys.forEach((key) => {
      let label = key
      if (key.includes(' ')) label = key.split(' ')[1]

      const dataIndex = dataKeys.indexOf(label)
      const targetIndex = dataKeys.indexOf(label + 'Target')
      const powerIndex = dataKeys.indexOf(label + 'Power')
      const speedIndex = dataKeys.indexOf(label + 'Speed')
      // const prettyName = Vue.$filters.startCase(label)

      if (dataIndex >= 0) this.createSeries(dataIndex, label, key)
      if (targetIndex >= 0) this.createSeries(targetIndex, label + 'Target', key)
      if (powerIndex >= 0) this.createSeries(powerIndex, label + 'Power', key)
      if (speedIndex >= 0) this.createSeries(speedIndex, label + 'Speed', key)
    })
  }

  // removeSeries () {}

  createSeries (index: number, label: string, key: string) {
    // Grab the color
    const color = Vue.$colorset.next(getKlipperType(key), key)

    // Base properties
    const series: any = {
      name: label,
      type: 'line',
      yAxisIndex: 0,
      showSymbol: false,
      animation: false,
      color,
      emphasis: {
        lineStyle: {
          width: 2
        }
      },
      lineStyle: {
        color,
        type: 'solid',
        width: 2,
        opacity: 0.85
      },
      areaStyle: {
        opacity: 0.05
      },
      encode: { x: 0, y: index }
    }

    // If this is a target, adjust its display.
    if (label.toLowerCase().endsWith('target')) {
      series.lineStyle.type = 'dashed'
      series.lineStyle.opacity = 0.25
      series.areaStyle.opacity = 0
    }

    // If this is a power, adjust its display.
    if (label.toLowerCase().endsWith('power')) {
      series.yAxisIndex = 1
      series.lineStyle.type = 'dotted'
      series.lineStyle.opacity = 0.35
      series.areaStyle.opacity = 0
    }

    // If this is a speed, adjust its display.
    if (label.toLowerCase().endsWith('speed')) {
      series.yAxisIndex = 1
      series.lineStyle.type = 'dotted'
      series.lineStyle.opacity = 0.35
      series.areaStyle.opacity = 0
    }

    if (
      label.toLowerCase().endsWith('power') ||
      label.toLowerCase().endsWith('speed')
    ) {
      this.legends.push({ name: label })
      if (label in this.selectedLegends === false) {
        this.legendUnSelect(label)
      }
    } else {
      this.legends.push({ name: label })
      if (label in this.selectedLegends === false) {
        this.legendSelect(label)
      }
    }

    this.series.push(series)
  }

  legendToggle (name: string) {
    if (this.selectedLegends[name] !== undefined) {
      if (this.selectedLegends[name]) {
        this.legendUnSelect(name)
        this.legendUnSelect(name + 'Target')
        this.legendUnSelect(name + 'Power')
        this.legendUnSelect(name + 'Speed')
      } else {
        this.legendSelect(name)
        this.legendSelect(name + 'Target')
      }
    }
  }

  legendUnSelect (name: string) {
    if (this.legends.findIndex((legend: any) => legend.name === name) >= 0) {
      this.selectedLegends = { ...this.selectedLegends, [name]: false }
    }
  }

  legendSelect (name: string) {
    if (this.legends.findIndex((legend: any) => legend.name === name) >= 0) {
      this.selectedLegends = { ...this.selectedLegends, [name]: true }
    }
  }

  tooltipPosition (pos: any, params: any, el: HTMLElement, elRect: any, size: any) {
    const obj: { [index: string]: any } = { top: 0 }
    obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
    return obj
  }

  tooltipFormatter (params: any) {
    let text = ''
    params.forEach((param: any) => {
      if (
        !param.seriesName.toLowerCase().endsWith('target') &&
        !param.seriesName.toLowerCase().endsWith('power') &&
        !param.seriesName.toLowerCase().endsWith('speed')
      ) {
        text += `
          <div>
            <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>
            <span style="font-size:16px;color:#666;font-weight:400;margin-left:2px">
              ${param.seriesName}:
            </span>
            <span style="float:right;margin-left:20px;font-size:16px;color:#666;font-weight:900">
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

  xAxisPointerFormatter (params: any) {
    const d = this.$dayjs(params.value)
    return d.format('hh:mm:ss')
  }

  yAxisPointerFormatter (params: any) {
    return params.value.toFixed() + '°C'
  }

  yAxisPowerFormatter (value: any) {
    return `${value * 100}%`
  }

  yAxisTempMax (value: any) {
    // Need to fix this..
    // console.log(value)
    return Math.ceil(value.max / 20) * 20
  }

  get maxExtruderTemp () {
    return this.$store.getters['socket/getPrinterSettings']('extruder.max_temp') || 240
  }
}

</script>

<style lang='scss' scoped>
  .chart {
    margin-top: 16px;
    width: 100%;
    height: 350px;
  }
</style>
