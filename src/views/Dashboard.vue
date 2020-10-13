<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col cols="12" md="6" class="pt-0">
        <klippy-disconnected-widget v-if="!klippyConnected"></klippy-disconnected-widget>
        <status-card v-if="klippyConnected"></status-card>
        <toolhead-card></toolhead-card>
      </v-col>
      <v-col cols="12" md="6" class="pt-0">
        <tools-card></tools-card>
        <temperature-card></temperature-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StatusCard from '@/components/cards/StatusCard.vue'
import ToolsCard from '@/components/cards/ToolsCard.vue'
import ToolheadCard from '@/components/cards/ToolheadCard.vue'
import TemperatureCard from '@/components/cards/TemperatureCard.vue'
import KlippyDisconnectedWidget from '@/components/widgets/configuration/KlippyDisconnectedWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    StatusCard,
    ToolsCard,
    ToolheadCard,
    TemperatureCard,
    KlippyDisconnectedWidget
  }
})
export default class Dashboard extends Mixins(UtilsMixin) {}
</script>

<style lang="scss">

</style>
