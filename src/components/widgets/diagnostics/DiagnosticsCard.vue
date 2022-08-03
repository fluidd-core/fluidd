<template>
  <collapsable-card
    :title="config.title"
    :icon="`$${config.icon}`"
    :draggable="true"
    :layout-path="`diagnostics.${config.id}`"
  >
    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          @click="$emit('edit', config)"
        >
          <v-icon>
            $edit
          </v-icon>
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
import { Component, Vue, Prop } from 'vue-property-decorator'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import AppChart from '@/components/ui/AppChart.vue'

@Component({
  components: { AppChart, CollapsableCard }
})
export default class DiagnosticsCard extends Vue {
  @Prop({ type: Object, required: true })
  public config!: DiagnosticsCardConfig

  get chartData () {
    return this.$store.state.charts.diagnostics || []
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get options () {
    const isDark = this.$store.state.config.uiSettings.theme.isDark
    const isMobile = this.isMobile

    const fontColor = (isDark) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const fontSize = (isMobile) ? 13 : 14

    const lineStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.05
    }

    const pointerStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.5
    }

    let right = (this.isMobile) ? 15 : 20
    if (this.config.axes.length > 1) right = (this.isMobile) ? 35 : 45

    const grid = {
      top: 20,
      left: (this.isMobile) ? 35 : 45,
      right,
      bottom: (this.isMobile) ? 52 : 38
    }

    const tooltip = {
      backgroundColor: (isDark) ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)',
      borderColor: (isDark) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
      textStyle: {
        color: fontColor,
        fontSize
      }
    }

    const theme = this.$store.getters['config/getTheme']
    const color = [
      theme.currentTheme.primary,
      theme.currentTheme.secondary
    ]

    const series = this.series

    const options = {
      grid,
      color,
      legend: {
        show: false,
        selected: true // changed
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
                    ${param.seriesName}:
                  </span>
                  <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                    ${value} ${metric.unit}
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
          const retention = this.$store.getters['charts/getChartRetention']
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
          rotate: (this.isMobile) ? 45 : 0
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
        name: axis.showLegend ? axis.unit : undefined,
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
        min: axis.min ?? undefined,
        max: axis.max ?? undefined,
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
    }

    return options
  }

  get series () {
    const series = []
    for (const [yAxisIndex, yAxis] of Object.entries(this.config.axes)) {
      for (const metric of yAxis.metrics) {
        series.push({
          name: metric.name,
          unit: yAxis.unit,
          displayLegend: metric.style.displayLegend,
          type: 'line',
          yAxisIndex: Number(yAxisIndex),
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
    const d = this.$dayjs(params.value)
    return d.format('H:mm:ss')
  }
}
</script>
