<template>
  <v-card class="mb-4">
    <v-card-title class="font-weight-light"><v-icon left>mdi-printer-3d-nozzle-alert-outline</v-icon> Runout Sensors</v-card-title>
    <v-card-subtitle>Indicate runout sensor status.<br /> These are not persistent. They will reset to your printer configuration on host reboot.</v-card-subtitle>
    <v-divider></v-divider>
    <v-card-text>
      <v-layout
        align-center justify-start
        class="py-1"
        v-for="item in sensors"
        :key="item.name">
        <span class="grey--text text--lighten-1 text-h5">{{ item.name }}</span>
        <v-icon
          :color="(item.filament_detected) ? 'success' : 'warning'"
          class="ml-3"
          left>
          {{ (item.filament_detected) ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        <v-switch
          class="ml-3"
          color="success"
          :input-value="item.enabled"
          @change="changeSensor(item, $event)"
          >
        </v-switch>
      </v-layout>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { RunoutSensor } from '@/store/socket/types'

@Component({
  components: {}
})
export default class RunoutSensorWidget extends Mixins(UtilsMixin) {
  get sensors () {
    return this.$store.getters['socket/getRunoutSensors']
  }

  changeSensor (item: RunoutSensor, value: boolean) {
    const enable: number = (value) ? 1 : 0
    this.sendGcode(`SET_FILAMENT_SENSOR SENSOR=${item.name} ENABLE=${enable}`)
  }
}
</script>
