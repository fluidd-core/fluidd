<template>
  <v-col
    cols="4"
    class="chart-wrapper"
    v-if="ready"
  >
    <app-chart
      :data="chartData || []"
      :options="options"
      height="120px"
    />

    <div class="chart-label-wrapper">
      <div class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_load', { mcu: mcu.toUpperCase() }) }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].load }}%</span>
      </div>

      <div class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_awake', { mcu: mcu.toUpperCase() }) }}</span>
        <span v-if="chartData.length">{{ chartData[chartData.length - 1].awake }}s</span>
      </div>

      <!-- <div v-if="chartData && chartData.length" class="chart-label">
        <span>{{ $t('app.system_info.label.mcu_bandwidth', { mcu: mcu.toUpperCase() })}}</span>
        <span>{{ chartData[chartData.length - 1].bw }}b</span>
      </div> -->
    </div>
  </v-col>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class McuLoadChart extends Vue {
  ready = false

  @Prop({ type: String, required: true })
  mcu!: string

  get chartData () {
    return this.$store.state.charts[this.mcu] || []
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions']({
        load: '%',
        awake: 's',
        bw: 'b'
      }),
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

    // const bw = this.$store.getters['charts/getBaseSeries']({
    //   name: 'bandwidth',
    //   encode: { x: 'date', y: 'bw' }
    // })

    return [load, awake]
  }

  @Watch('chartData', { immediate: true })
  onChartData (data: any) {
    if (data && data.length > 0) this.ready = true
  }
}
</script>
