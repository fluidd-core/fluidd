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
import type { DatasetComponentOption, EChartsOption } from 'echarts'
import { get } from 'lodash-es'

export type AppInlineChartLabel = {
  text: string
  value: string
  suffix?: string
}

@Component({})
export default class AppInlineChart extends Vue {
  @Prop({ type: Array, required: true })
  readonly data!: Extract<DatasetComponentOption['source'], unknown[]>

  @Prop({ type: Object, required: true })
  readonly options!: EChartsOption

  @Prop({ type: Array, required: true })
  readonly labels!: AppInlineChartLabel[]

  get hasData (): boolean {
    return (
      Array.isArray(this.data) &&
      this.data.length > 0
    )
  }

  isEmpty (value: unknown) {
    return (
      value == null ||
      value === '' ||
      (
        Array.isArray(value) &&
        value.length === 0
      )
    )
  }

  get items () {
    const item = this.data[this.data.length - 1]

    return this.labels.map(label => {
      const value = get(item, label.value)

      return {
        label,
        value: this.isEmpty(value)
          ? '--'
          : `${value}${label.suffix ?? ''}`
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
