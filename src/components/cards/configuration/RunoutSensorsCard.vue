<template>
  <collapsable-card
    title="Runout Sensors"
    icon="$printer3dNozzleAlert">
    <v-card-text>
      <v-layout
        align-center justify-start
        class="py-1"
        v-for="item in sensors"
        :key="item.name">
        <span class="grey--text text--lighten-1 text-subtitle-1">{{ item.name }}</span>
        <v-icon
          :color="(item.filament_detected) ? 'success' : 'warning'"
          class="ml-3"
          left>
          {{ (item.filament_detected) ? '$checkedCircle' : '$alertCircle' }}
        </v-icon>
        <v-switch
          class="ml-2"
          color="success"
          :input-value="item.enabled"
          @change="changeSensor(item, $event)"
          >
        </v-switch>
      </v-layout>
    </v-card-text>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { RunoutSensor } from '@/store/socket/types'

@Component({})
export default class BedMeshCard extends Mixins(UtilsMixin) {
  get sensors () {
    return this.$store.getters['socket/getRunoutSensors']
  }

  changeSensor (item: RunoutSensor, value: boolean) {
    const enable: number = (value) ? 1 : 0
    this.sendGcode(`SET_FILAMENT_SENSOR SENSOR=${item.name} ENABLE=${enable}`)
  }
}
</script>
