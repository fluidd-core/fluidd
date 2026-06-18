<template>
  <v-col
    cols="4"
    class="chart-wrapper"
  >
    <app-chart
      :data="chartData"
      :options="options"
      height="120px"
    />

    <div class="chart-label-wrapper">
      <div class="chart-label">
        <span>{{ label }}</span>
        <span v-if="currentValue != null">{{ currentValue }}{{ units ? ` ${units}` : '' }}</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import type { ChartData } from '@/store/charts/types'

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

  get currentValue (): number | null {
    const lastEntry = this.chartData[this.chartData.length - 1]
    const value = lastEntry?.[this.field]

    return typeof value === 'number'
      ? Math.round(value * 100) / 100
      : null
  }

  get options (): EChartsOption {
    return {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        [this.field]: this.units ?? ''
      }),
      dataset: {
        source: this.chartData
      },
      series: this.series
    }
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

<style lang="scss" scoped>
  .chart-label-wrapper {
    margin-top: 6px;
    display: block;
  }

  .chart-label {
    display: flex;
    justify-content: space-between;
  }
</style>
