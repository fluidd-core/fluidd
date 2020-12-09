<script lang="ts">
import { Vue, Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import Chart from 'chart.js'
import { Line, mixins } from 'vue-chartjs'
import { range } from 'lodash-es'
import 'chartjs-plugin-colorschemes'

@Component({})
export default class TemperatureChartWidget extends Mixins(Line, mixins.reactiveProp) {
  @Prop({ required: true, default: {} })
  public chartData!: Chart.ChartData

  @Prop({ default: false })
  public resetChart!: boolean;

  @Prop()
  public chartOptions!: Chart.ChartOptions;

  private options: Chart.ChartOptions = {};
  private chart!: Chart;
  private chartTimer = -1;

  @Watch('chartData')
  onChartDataChange () {
    this.updateChart()
  }

  mounted () {
    if (!this.chartOptions) {
      this.applyDefaultOptions()
    }

    // Draw chart
    this.renderChart(this.chartData, this.options)
    this.chart = this.$data._chart

    // Update chart
    // this.chartTimer = setInterval(this.updateChart, 1000)
  }

  get maxExtruderTemp () {
    return (this.$store.state.socket.printer.configfile.config.extruder.max_temp)
      ? parseInt(this.$store.state.socket.printer.configfile.config.extruder.max_temp)
      : 240 // Default to a sane value
  }

  private getAxesConfig () {
    const stepSize = 60
    const r = range(0, stepSize * 20, stepSize)
    const xMax = new Date()
    const xMin = new Date().setMinutes(xMax.getMinutes() - 10)

    let yMax = r.reduce((p, c) => {
      return (Math.abs(c - this.maxExtruderTemp) < Math.abs(p - this.maxExtruderTemp) ? c : p)
    })
    yMax = (yMax < this.maxExtruderTemp) ? yMax + stepSize : yMax

    return {
      x: {
        min: xMin,
        max: xMax
      },
      y: {
        min: 0,
        max: yMax
      },
      stepSize
    }
  }

  private updateChart () {
    const config = this.getAxesConfig()
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
      this.chart.config.options.scales.xAxes[0].ticks.min = config.x.min
      this.chart.config.options.scales.xAxes[0].ticks.max = config.x.max
      this.chart.config.options.scales.yAxes[0].ticks.min = config.y.min
      this.chart.config.options.scales.yAxes[0].ticks.max = config.y.max
      // this.chart.update()
    }
  }

  private applyDefaultOptions () {
    const config = this.getAxesConfig()
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
            min: config.x.min,
            max: config.x.max,
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
            min: config.y.min,
            max: config.y.max,
            stepSize: config.stepSize,
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
}

</script>
