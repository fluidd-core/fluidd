<template>
  <v-col
    v-if="hasData"
    cols="4"
    class="chart-wrapper"
  >
    <app-chart
      :data="data"
      :options="options"
      height="120px"
    />

    <div class="chart-label-wrapper">
      <div
        v-for="{ label, value } in items"
        :key="label.value"
        class="chart-label"
      >
        <span>{{ label.text }}</span>
        <span>{{ value }}</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { EChartsOption } from 'echarts'
import type { ChartDataSource } from '@/util/chart-buffer'

export type AppInlineChartLabel = {
  text: string
  value: string
  suffix?: string
}

@Component({})
export default class AppInlineChart extends Vue {
  @Prop({ type: Object, required: true })
  readonly data!: ChartDataSource

  @Prop({ type: Object, required: true })
  readonly options!: EChartsOption

  @Prop({ type: Array, required: true })
  readonly labels!: AppInlineChartLabel[]

  get hasData (): boolean {
    return this.data.date.length > 0
  }

  get items () {
    const lastIndex = this.data.date.length - 1

    return this.labels.map(label => {
      const value = lastIndex >= 0 ? this.data[label.value]?.[lastIndex] : undefined

      return {
        label,
        value: (value == null || Number.isNaN(value))
          ? '--'
          : `${value !== 0 ? value.toFixed(2) : value}${label.suffix ?? ''}`
      }
    })
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
