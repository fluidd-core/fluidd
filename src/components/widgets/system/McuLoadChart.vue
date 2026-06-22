<template>
  <app-inline-chart
    :data="chartData"
    :options="options"
    :labels="labels"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { MCU } from '@/store/printer/types'
import type { EChartsOption, LineSeriesOption } from 'echarts'
import type { AppInlineChartLabel } from '@/components/ui/AppInlineChart.vue'

@Component({})
export default class McuLoadChart extends Vue {
  @Prop({ type: Object, required: true })
  readonly mcu!: MCU

  get chartData () {
    return this.$typedState.charts[this.mcu.key] || []
  }

  get labels (): AppInlineChartLabel[] {
    return [
      {
        text: this.$t('app.system_info.label.mcu_load', { mcu: this.mcu.prettyName }).toString(),
        value: 'load',
        suffix: ' %'
      },
      {
        text: this.$t('app.system_info.label.mcu_awake', { mcu: this.mcu.prettyName }).toString(),
        value: 'awake',
        suffix: ' %'
      }
    ]
  }

  get options (): EChartsOption {
    const options: EChartsOption = {
      ...this.$typedGetters['charts/getBaseChartOptions']({
        load: ' %',
        awake: ' %',
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
}
</script>
