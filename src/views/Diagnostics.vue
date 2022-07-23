<template>
  <v-row>
    <v-col cols="6">
      <collapsable-card
        icon="$printer3dNozzle"
        :title="$t('app.general.label.flow')"
      >
        <app-chart
          :data="flowData"
          :options="flowOptions"
          height="300px"
        />
      </collapsable-card>
    </v-col>
    <v-col cols="6">
      <collapsable-card
        icon="$motion"
        :title="$t('app.general.label.speed')"
      >
        <app-chart
          :data="velocityData"
          :options="velocityOptions"
          height="300px"
        />
      </collapsable-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AppChart from '@/components/ui/AppChart.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'

@Component({
  components: { CollapsableCard, AppChart }
})
export default class Diagnostics extends Mixins(StateMixin) {
  ready = false
  metadata = {
    extrusion_rate: { suffix: 'mm³/s', name: this.$t('app.general.label.flow') },
    velocity: { suffix: 'mm/s', name: this.$t('velocity') }
  } as {[type: string]: {suffix: string, name: string}}

  get flowData () { return this.$store.state.charts.extrusion_rate || [] }
  get flowOptions () { return this.options('extrusion_rate') }

  get velocityData () { return this.$store.state.charts.velocity || [] }
  get velocityOptions () { return this.options('velocity') }

  options (type: string) {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions']({
        [type]: this.metadata[type].suffix
      }),
      series: this.series(type),
      dataZoom: [{
        type: 'inside',
        zoomOnMouseWheel: 'shift'
      }]
    }

    o.yAxis.max = o.yAxis.min = undefined
    o.yAxis.axisLabel = { formatter: `{value} ${this.metadata[type].suffix}`, show: true }
    console.log(o)

    return o
  }

  series (type: string) {
    return this.$store.getters['charts/getBaseSeries']({
      name: this.metadata[type].name,
      encode: { x: 'date', y: type }
    })
  }
}
</script>
