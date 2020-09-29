<script lang="ts">
/* eslint-disable padded-blocks */
import { Vue, Component, Prop, Mixins, Emit } from 'vue-property-decorator'
import Chart from 'chart.js'
import VueChart from 'vue-chartjs'
import 'chartjs-plugin-colorschemes'

@Component({})
export default class TemperatureChartWidget extends Mixins(VueChart.Line, VueChart.mixins.reactiveProp) {

  @Prop({ required: true, default: {} })
  public chartData!: Chart.ChartData

  @Prop({ default: false })
  public resetChart!: boolean;

  @Prop()
  public chartOptions!: Chart.ChartOptions;

  private options: Chart.ChartOptions = {};
  private chart!: Chart;
  private chartTimer = -1;

  mounted () {
    if (!this.chartOptions) {
      this.applyDefaultOptions()
    }

    // Draw chart
    this.renderChart(this.chartData, this.options)
    this.chart = this.$data._chart

    // Update chart
    this.chartTimer = setInterval(this.updateChart, 500)
  }

  private getXTicks () {
    const maxTick = new Date()
    const minTick = new Date().setMinutes(maxTick.getMinutes() - 10)
    return {
      min: minTick,
      max: maxTick
    }
  }

  private updateChart () {
    const ticks = this.getXTicks()
    // if (this.options && this.options.scales && this.options.scales.xAxes && this.options.scales.xAxes.length && this.options.scales.xAxes[0].ticks) {
    // this.options.scales.xAxes[0].ticks.min = ticks.min
    // this.options.scales.xAxes[0].ticks.max = ticks.max
    if (
      this.chart &&
      this.chart.config &&
      this.chart.config.options &&
      this.chart.config.options.scales &&
      this.chart.config.options.scales.xAxes &&
      this.chart.config.options.scales.xAxes.length &&
      this.chart.config.options.scales.xAxes[0].ticks &&
      this.chart.config.options.scales.yAxes &&
      this.chart.config.options.scales.yAxes.length &&
      this.chart.config.options.scales.yAxes[0].ticks
    ) {
      this.chart.config.options.scales.xAxes[0].ticks.min = ticks.min
      this.chart.config.options.scales.xAxes[0].ticks.max = ticks.max
      this.chart.config.options.scales.yAxes[0].ticks.max = 300
      // this.chart.update()
    }
  }

  private applyDefaultOptions () {
    const ticks = this.getXTicks()
    // this.options.onClick = this.onClick
    this.options.maintainAspectRatio = false
    this.options.responsive = true
    this.options.scales = {
      xAxes: [
        {
          gridLines: {
            color: '#333333'
          },
          type: 'time',
          time: {
            // parser: 'MM/DD/YYYY HH:mm',
            unit: 'minute',
            displayFormats: {
              minute: 'YYYY-MM-DDTHH:mm:ssZ'
            }
          },
          ticks: {
            min: ticks.min,
            max: ticks.max,
            callback: (value) => {
              return Vue.$dayjs(value, { locale: 'en-chart' }).fromNow(true)
            }
          }
        }
      ],
      yAxes: [
        {
          gridLines: {
            color: '#333333'
          },
          ticks: {
            min: 0,
            max: 300,
            stepSize: 60,
            callback: (value) => {
              return value + '°C'
            }
          }
        }
      ]
    }

    this.options.plugins = {
      colorschemes: {
        scheme: 'tableau.GoldPurple7',
        fillAlpha: 0.05
      }
    }

    this.options.elements = {
      point: {
        radius: 0
      },
      line: {
        tension: 0
      }
    }

    this.options.legend = {
      labels: {
        filter: (item) => {
          if (item && item.text) {
            return !item.text.includes('Target')
          }
        }
      }
    }

    this.options.tooltips = {
      enabled: false,
      mode: 'x',
      intersect: false,
      position: 'nearest',
      titleAlign: 'left'
    }

    this.options.hover = {
      mode: undefined
    }
  }

  private onClick (
    event?: MouseEvent | undefined,
    activeElements?: {}[] | undefined
  ): any {
    const element = this.chart.getElementAtEvent(event)
    if (element && element.length > 0) {
      this.clickChartElement(element)
    }
  }

  /**
   * Reset chart position
   */
  // @Watch('resetChart')
  // private resetChartPosition() {
  //   console.log(this.chart);
  //   if (this.resetChart) {
  //     const chart: any = this.zoomChartInstance;
  //     chart.resetZoom();
  //   }
  // }

  @Emit('click-chart-element')
  public clickChartElement (element: any) {
    return element
  }
}

</script>
