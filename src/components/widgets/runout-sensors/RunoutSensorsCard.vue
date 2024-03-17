<template>
  <collapsable-card
    :title="$t('app.general.title.runout_sensors')"
    icon="$printer3dNozzleAlert"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.runout-sensors-card"
  >
    <template #menu>
      <app-btn
        v-if="!fullscreen"
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="$filters.routeTo($router, '/tune')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>
    </template>

    <v-card-text>
      <v-layout
        v-for="item in sensors"
        :key="item.name"
        align-center
        justify-start
        class="py-1"
      >
        <span class="text-subtitle-1">{{ item.name }}</span>
        <v-icon
          :color="(item.filament_detected) ? 'success' : 'warning'"
          class="ml-3"
          left
        >
          {{ (item.filament_detected) ? '$checkedCircle' : '$alertCircle' }}
        </v-icon>
        <v-switch
          class="ml-2"
          color="success"
          :input-value="item.enabled"
          @change="changeSensor(item, $event)"
        />
      </v-layout>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { RunoutSensor } from '@/store/printer/types'

@Component({})
export default class RunoutSensorsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  get sensors () {
    return this.$store.getters['printer/getRunoutSensors']
  }

  changeSensor (item: RunoutSensor, value: boolean) {
    const enable: number = (value) ? 1 : 0
    this.sendGcode(`SET_FILAMENT_SENSOR SENSOR=${item.name} ENABLE=${enable}`)
  }
}
</script>
