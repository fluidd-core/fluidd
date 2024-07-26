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

    <v-container class="px-0 py-2">
      <v-row
        v-for="item in sensors"
        :key="item.name"
      >
        <v-col class="pb-0">
          <v-subheader>
            <span>{{ item.name }}</span>
            <v-spacer />
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
          </v-subheader>
        </v-col>
      </v-row>
    </v-container>
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
