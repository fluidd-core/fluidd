<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col class="pt-0">
        <status-card></status-card>
        <toolhead-card></toolhead-card>
      </v-col>
      <v-col class="pt-0">
        <tools-card></tools-card>
        <temperature-card></temperature-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
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
export default class Dashboard extends Vue {}
</script>

<style lang="scss">

</style>
