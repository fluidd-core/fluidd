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
      <slot />
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { DatasetComponentOption, EChartsOption } from 'echarts'

@Component({})
export default class SystemChart extends Vue {
  @Prop({ type: Array, required: true })
  readonly data!: Extract<DatasetComponentOption['source'], unknown[]>

  @Prop({ type: Object, required: true })
  readonly options!: EChartsOption

  get hasData (): boolean {
    return (
      Array.isArray(this.data) &&
      this.data.length > 0
    )
  }
}
</script>

<style lang="scss">
  .chart-label-wrapper {
    margin-top: 6px;
    display: block;
  }

  .chart-label {
    display: flex;
    justify-content: space-between;
  }
</style>
