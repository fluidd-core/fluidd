<template>
  <div
    class="chart"
    :style="{ 'height': height }"
  >
    <e-chart
      ref="chart"
      :option="opts"
      :update-options="{ notMerge: false }"
      :init-options="{ renderer: 'canvas' }"
      autoresize
    />

    <!-- <pre>legends: {{ opts.legend }}</pre> -->

    <!-- <pre>series: {{ opts.series.length }}</pre> -->
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Watch, Ref, Mixins } from 'vue-property-decorator'
import type { ECharts, EChartsOption, GraphicComponentOption } from 'echarts'
import { merge, cloneDeepWith } from 'lodash-es'
import BrowserMixin from '@/mixins/browser'
import type { BedSize } from '@/store/printer/types'

@Component({})
export default class BedMeshChart extends Mixins(BrowserMixin) {
  @Prop({ type: Array, required: true })
  readonly data!: []

  @Prop({ type: Array<GraphicComponentOption>, default: () => [] })
  readonly graphics!: GraphicComponentOption[]

  @Prop({ type: Object, default: () => {} })
  readonly options!: Record<string, unknown>

  @Prop({ type: String, default: '100%' })
  readonly height!: string

  @Ref('chart')
  readonly chart!: ECharts

  get flatSurface () {
    return this.$store.state.mesh.flatSurface
  }

  get bedSize (): BedSize | undefined {
    return this.$store.getters['printer/getBedSize'] as BedSize | undefined
  }

  @Watch('flatSurface')
  onFlatSurfaceChange (value: boolean) {
    const type = value ? 'legendSelect' : 'legendUnSelect'
    this.chart.dispatchAction({
      type,
      name: 'mesh_matrix_flat'
    })
    this.chart.dispatchAction({
      type,
      name: 'probed_matrix_flat'
    })
  }

  beforeDestroy () {
    if (typeof window === 'undefined') return
    this.chart.dispose()
  }

  get opts (): EChartsOption {
    // If options includes series data, rip it out so we can merge it with
    // the given series in our initial options.
    const darkMode = this.$store.state.config.uiSettings.theme.isDark

    const fontColor = (darkMode) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const fontSize = (this.isMobileViewport) ? 14 : 16
    const labelBackground = (darkMode) ? 'rgba(10,10,10,0.90)' : 'rgba(255,255,255,0.90)'
    const opacity = 0.10
    const lineColor = (darkMode) ? '#ffffff' : '#000000'
    const visualMap = {
      itemWidth: (this.isMobileViewport) ? 15 : 25,
      itemHeight: (this.isMobileViewport) ? 140 : 280
    }

    const axisCommon = {
      nameTextStyle: {
        color: fontColor
      },
      axisPointer: {
        lineStyle: {
          color: lineColor,
          opacity: 0.65
        },
        label: {
          margin: 16,
          color: fontColor,
          fontSize
        }
      },
      axisTick: {
        lineStyle: {
          color: lineColor,
          opacity
        }
      },
      axisLine: {
        lineStyle: {
          color: lineColor,
          opacity,
          width: 2
        }
      },
      axisLabel: {
        textStyle: {
          color: fontColor,
          fontSize
        }
      },
      splitLine: {
        lineStyle: {
          color: lineColor,
          opacity
        }
      }
    }

    const graphic = cloneDeepWith(this.graphics, g => {
      switch (g.type) {
        case 'text':
          return {
            ...g,
            style: {
              ...g.style,
              fill: fontColor,
              fontSize
            }
          }
        default:
          return undefined
      }
    })

    const opts: EChartsOption = {
      legend: {
        show: false
      },
      textStyle: {
        fontFamily: 'Roboto'
      },
      darkMode,
      tooltip: {
        backgroundColor: labelBackground,
        borderColor: labelBackground,
        textStyle: {
          color: fontColor,
          fontSize: 18
        },
        formatter: (params: any) => {
          let text = ''
          if (params.value && Array.isArray(params.value)) {
            text += `
              <div>
                <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  ${this.$filters.prettyCase(params.seriesName)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  x: ${params.value[0].toFixed(4)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  y: ${params.value[1].toFixed(4)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  z: ${params.value[2].toFixed(4)}
                </span>
                <div style="clear: both"></div>
              </div>
              `
          }
          return text
        }
      },
      visualMap: {
        type: 'continuous',
        textStyle: {
          color: fontColor,
          fontSize
        },
        realtime: true,
        calculable: true,
        show: true,
        top: 0,
        right: 'auto',
        bottom: 'auto',
        left: 0,
        dimension: 2,
        precision: 4,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        ...visualMap
      },
      xAxis3D: {
        type: 'value',
        min: this.bedSize?.minX,
        max: this.bedSize?.maxX,
        ...axisCommon
      },
      yAxis3D: {
        type: 'value',
        min: this.bedSize?.minY,
        max: this.bedSize?.maxY,
        ...axisCommon
      },
      zAxis3D: {
        type: 'value',
        min: -0.5,
        max: 0.5,
        ...axisCommon
      },
      grid3D: {
        viewControl: {
          // distance: 100,
          rotateSensitivity: 1.8,
          zoomSensitivity: 2,
          rotateMouseButton: 'left',
          panMouseButton: 'right'
        }
      },
      graphic,
      series: [...this.data]
    }

    // Merge the default options with the given prop.
    merge(opts, this.options)
    return opts
  }

  async copyImage () {
    const image = await fetch(this.chart.getDataURL({ type: 'png', backgroundColor: '#262629' }))

    const blob = await image.blob()

    const data = [
      new ClipboardItem({ 'image/png': blob })
    ]

    await navigator.clipboard.write(data)
  }
}
</script>

<style lang='scss' scoped>
  .chart {
    margin-top: 16px;
    width: 100%;
    // height: 625px;
  }
</style>
