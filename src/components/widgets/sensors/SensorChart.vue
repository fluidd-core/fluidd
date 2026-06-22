<template>
  <app-inline-chart
    :data="chartData"
    :options="options"
    :labels="labels"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import type { ChartData } from '@/store/charts/types'
import type { AppInlineChartLabel } from '@/components/ui/AppInlineChart.vue'

@Component({})
export default class SensorChart extends Vue {
  @Prop({ type: String, required: true })
  readonly sensorId!: string

  @Prop({ type: String, required: true })
  readonly field!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String })
  readonly units?: string

  get chartData (): ChartData[] {
    return this.$typedState.charts[`sensor:${this.sensorId}`] ?? []
  }

  get suffix (): string {
    return this.units
      ? ` ${this.units}`
      : ''
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.label,
        value: this.field,
        suffix: this.suffix
      }
    ]
  }

  get options (): EChartsOption {
    const options: EChartsOption = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        [this.field]: this.suffix
      }),
      series: this.series
    }

    if (
      options.yAxis &&
      !Array.isArray(options.yAxis)
    ) {
      options.yAxis.min = (value) => Math.min(0, value.min)
      options.yAxis.max = (value) => Math.max(1, value.max * 1.1)
    }

    return options
  }

  get series (): LineSeriesOption {
    return {
      ...this.$typedGetters['charts/getBaseSeries'],
      name: this.label,
      encode: {
        x: 'date',
        y: this.field
      }
    }
  }
}
</script>
