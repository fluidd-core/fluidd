<template>
  <collapsable-card
    :title="config.title"
    :icon="`$${config.icon}`"
    :draggable="true"
    :layout-path="`diagnostics.${config.id}`"
  >
    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          class="ml-1"
          @click="$emit('edit', config)"
        >
          <v-icon>
            $edit
          </v-icon>
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <AppChart
      :data="chartData"
      :height="`${config.height}px`"
      :options="options"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import AppChart from '@/components/ui/AppChart.vue'

@Component({
  components: { AppChart, CollapsableCard }
})
export default class DiagnosticsCard extends Vue {
  @Prop({ type: Object, required: true })
  public config!: DiagnosticsCardConfig

  get chartData () {
    return this.$store.state.charts.klipper || []
  }

  get options () {
    const o = {
      ...this.$store.getters['charts/getBaseChartOptions']({
        cputime_change: '%'
      }),
      series: this.series
    }
    return o
  }

  get series () {
    return this.$store.getters['charts/getBaseSeries']({
      name: 'load',
      encode: { x: 'date', y: 'cputime_change' }
    })
  }
}
</script>
