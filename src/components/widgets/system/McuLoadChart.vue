<template>
  <v-col
    cols="4"
    class="chart-wrapper"
    v-if="chartData"
  >
    <app-chart
      :data="this.$store.state.charts[name] || []"
      :options="options"
      height="120px"
    >
    </app-chart>

    <div class="chart-label-wrapper">
      <div v-if="chartData && chartData.length" class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_load', { mcu: mcu.toUpperCase() })}}</span>
        <span>{{ chartData[chartData.length - 1].load }}%</span>
      </div>

      <div v-if="chartData && chartData.length" class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_awake', { mcu: mcu.toUpperCase() })}}</span>
        <span>{{ chartData[chartData.length - 1].awake }}%</span>
      </div>
    </div>

  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class McuLoadChart extends Vue {
  @Prop({ type: String, required: true })
  mcu!: string

  get chartData () {
    return this.$store.state.charts[this.name]
  }

  get name () {
    return this.mcu.replace(' ', '_')
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions'](),
      series: this.series
    }
    o.yAxis.max = (value: any) => {
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
    // o.yAxis.max = 'dataMax'
    return o
  }

  get series () {
    const load = this.$store.getters['charts/getBaseSeries']({
      name: 'load',
      encode: { x: 'date', y: 'load' }
    })

    const awake = this.$store.getters['charts/getBaseSeries']({
      name: 'awake time',
      encode: { x: 'date', y: 'awake' }
    })

    return [load, awake]
  }
}
</script>
