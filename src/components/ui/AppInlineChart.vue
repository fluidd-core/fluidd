<template>
  <v-col
    v-if="hasData"
    class="app-inline-chart"
    cols="4"
  >
    <app-chart
      class="app-inline-chart__chart"
      :data="data"
      :options="options"
      height="120px"
    />

    <div class="app-inline-chart__label-wrapper">
      <div
        v-for="{ label, value } in items"
        :key="label.value"
        class="app-inline-chart__label"
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
import type { ChartDataSource } from '@/store/charts/types'

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

    return this.labels
      .map(label => {
        const value = this.data[label.value]?.[lastIndex]

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
  .app-inline-chart {
    .app-inline-chart__label-wrapper {
      margin-top: 6px;
      display: block;
    }

    .app-inline-chart__label {
      display: flex;
      justify-content: space-between;
    }
  }
</style>
