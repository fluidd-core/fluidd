<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col class="pt-0">
        <status-card></status-card>
        <toolhead-card></toolhead-card>
      </v-col>
      <v-col class="pt-0">
        <tools-card></tools-card>
          <!-- <p>sensor counts: <br />
            {{ sensorCounts.chamber }}<br />
            {{ sensorCounts.chamberTarget }}<br />
            {{ sensorCounts.heater_bed }}<br />
            {{ sensorCounts.heater_bedTarget }}<br />
            {{ sensorCounts.extruder }}<br />
            {{ sensorCounts.extruderTarget }}<br />
          </p> -->
        <temperature-card></temperature-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import StatusCard from '@/components/cards/StatusCard.vue'
import ToolsCard from '@/components/cards/ToolsCard.vue'
import ToolheadCard from '@/components/cards/ToolheadCard.vue'
import TerminalCard from '@/components/cards/TerminalCard.vue'
import TemperatureCard from '@/components/cards/TemperatureCard.vue'
import WebCamCard from '@/components/cards/WebCamCard.vue'

@Component({
  components: {
    StatusCard,
    ToolsCard,
    ToolheadCard,
    TerminalCard,
    TemperatureCard,
    WebCamCard
  }
})
export default class Dashboard extends Vue {
  get sensorCounts () {
    const r: { [key: string]: any } = {}
    if (this.$store.state.socket.chart.length) {
      for (const e of this.$store.state.socket.chart) {
        r[e.label] = {}
        r[e.label].label = e.label
        r[e.label].data = e.data.length
        r[e.label].firstEntry = {
          x: this.$dayjs(e.data[0].x).format('hh:mm:ss'),
          y: e.data[0].y
        }
        r[e.label].lastEntry = {
          x: this.$dayjs(e.data[e.data.length - 1].x).format('hh:mm:ss'),
          y: e.data[e.data.length - 1].y
        }
      }
    }
    return r
  }
}
</script>

<style lang="scss">

</style>
