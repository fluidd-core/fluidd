<template>
  <collapsable-card
    :title="config.title"
    :icon="`$${config.icon}`"
    draggable
    :layout-path="`diagnostics.${config.id}`"
  >
    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          @click="$emit('edit', config)"
        >
          <v-icon
            small
            left
          >
            $edit
          </v-icon>
          {{ $t('app.general.title.edit_chart') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <app-chart
      class="mt-2"
      :data="chartData"
      :height="`${config.height}px`"
      :options="options"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import type { EChartsOption } from 'echarts'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class DiagnosticsCard extends Mixins(BrowserMixin) {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  get chartData () {
    return this.$store.state.charts.diagnostics || []
  }

  get options () {
    const isDark: boolean = this.$store.state.config.uiSettings.theme.isDark

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
    if (this.config.axes.length > 1) right = (this.isMobileViewport) ? 35 : 45

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

    const series = this.series

    const options = {
      grid,
      color,
      textStyle: {
        fontFamily: 'Roboto'
      },
      legend: {
        show: false
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
        formatter: (params: any) => {
          let text = ''
          params
            .forEach((param: any) => {
              const metric = series[param.seriesIndex]
              if (!metric.displayLegend) return

              let value = param.data[metric.encode.y]
              if (typeof value === 'number') value = Math.round(value * 1000) / 1000
              else if (!value) value = '-'

              text += `
                <div>
                  ${param.marker}
                  <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                    ${this.sanitize(param.seriesName)}:
                  </span>
                  <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                    ${this.sanitize(value)} ${this.sanitize(metric.unit)}
                  </span>
                  <div style="clear: both"></div>
                </div>
                <div style="clear: both"></div>`
            })
          return text
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        max: 'dataMax',
        min: (value: any) => {
          const retention: number = this.$store.getters['charts/getChartRetention']
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
      yAxis: this.config.axes.map((axis, index) => ({
        name: (axis.enabled && axis.showLegend) ? axis.unit : undefined,
        nameTextStyle: {
          fontSize,
          color: fontColor,
          align: ['left', 'right'][index]
        },
        nameGap: 8,
        show: true,
        type: 'value',
        position: ['left', 'right'][index],
        splitLine: { show: true, lineStyle },
        min: [undefined, ''].includes(axis.min as any) ? undefined : axis.min,
        max: [undefined, ''].includes(axis.max as any) ? undefined : axis.max,
        axisLabel: axis.showLegend
          ? {
              color: fontColor,
              fontSize,
              formatter: '{value}'
            }
          : undefined
      })),
      dataZoom: [{
        type: 'inside',
        zoomOnMouseWheel: 'shift'
      }],
      series
    } as EChartsOption

    return options
  }

  sanitize (value: any): string {
    return value
      .toString()
      .replace(/[^a-z0-9]/gi, (char: string) => `&#${char.charCodeAt(0)};`)
  }

  get series () {
    const series = []
    for (const [yAxisIndex, yAxis] of Object.entries(this.config.axes)) {
      if (!yAxis.enabled) continue
      for (const metric of yAxis.metrics) {
        series.push({
          name: metric.name,
          unit: yAxis.unit,
          displayLegend: metric.style.displayLegend,
          type: 'line',
          yAxisIndex: +yAxisIndex,
          showSymbol: false,
          animation: false,
          color: metric.style.lineColor,
          emphasis: {
            lineStyle: {
              width: 1.5
            }
          },
          lineStyle: {
            color: metric.style.lineColor,
            type: metric.style.lineStyle,
            width: 1.5,
            opacity: 1
          },
          areaStyle: {
            opacity: metric.style.fillOpacity / 100,
            color: metric.style.fillColor ?? metric.style.lineColor
          },
          encode: { x: 'date', y: metric.collector }
        })
      }
    }

    return series
  }

  xAxisPointerFormatter (params: any) {
    return this.$filters.formatTimeWithSeconds(params.value)
  }
}
</script>
