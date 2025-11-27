<template>
  <v-col
    v-if="ready"
    cols="4"
    class="chart-wrapper"
  >
    <app-chart
      :data="chartData || []"
      :options="options"
      height="120px"
    />

    <div class="chart-label-wrapper">
      <div class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_load', { mcu: mcu.prettyName }) }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }}%</span>
      </div>

      <div class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_awake', { mcu: mcu.prettyName }) }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].awake }}%</span>
      </div>
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import type { MCU } from '@/store/printer/types'
import type { EChartsOption, LineSeriesOption } from 'echarts'

@Component({})
export default class McuLoadChart extends Vue {
  ready = false

  @Prop({ type: Object, required: true })
  readonly mcu!: MCU

  get chartData () {
    return this.$typedState.charts[this.mcu.key] || []
  }

  get options (): EChartsOption {
    const options: EChartsOption = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        load: '%',
        awake: '%',
        bw: 'b'
      }),
      series: this.series
    }

    if (
      options.yAxis &&
      !Array.isArray(options.yAxis)
    ) {
      options.yAxis.max = (value) => {
        // Grab the max, and add some buffer.
        if (value.max <= 10) return 15
        if (value.max <= 20) return 25
        if (value.max <= 30) return 35
        if (value.max <= 40) return 45
        if (value.max <= 50) return 55
        if (value.max <= 50) return 55
        if (value.max <= 60) return 65
        if (value.max <= 70) return 75
        if (value.max <= 80) return 85
        return value.max
      }
    }

    return options
  }

  get series (): LineSeriesOption[] {
    return [
      {
        ...this.$typedGetters['charts/getBaseSeries'],
        name: this.$t('app.system_info.label.load').toString(),
        encode: {
          x: 'date',
          y: 'load'
        }
      },
      {
        ...this.$typedGetters['charts/getBaseSeries'],
        name: this.$t('app.system_info.label.awake_time').toString(),
        encode: {
          x: 'date',
          y: 'awake'
        }
      }
    ]
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
