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

    <v-list>
      <v-list-item
        v-for="item in sensors"
        :key="item.name"
      >
        <v-list-item-content>
          <v-list-item-title>{{ item.prettyName }}</v-list-item-title>
          <v-list-item-subtitle v-if="loadsFilament(item)">
            {{ $t('app.general.label.loads_filament_always_on') }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon
            v-if="item.filament_detected"
            color="success"
          >
            $checkedCircle
          </v-icon>
          <v-icon
            v-else
            color="warning"
          >
            $alertCircle
          </v-icon>
        </v-list-item-icon>
        <v-list-item-action>
          <v-switch
            :input-value="item.enabled"
            :disabled="item.enabled && !canTurnOff(item)"
            @change="changeSensor(item, $event)"
          />
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { RunoutSensor } from '@/store/printer/types'
import { filamentSensorRole, sensorCommand, type SensorConfigFile } from '@/services/control/model'

@Component({})
export default class RunoutSensorsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  get sensors () {
    return this.$store.getters['printer/getRunoutSensors']
  }

  get configfile (): SensorConfigFile | undefined {
    return this.$store.state.printer.printer.configfile
  }

  /** Its insert_gcode starts the automatic load (the M1's), so it stays on. */
  loadsFilament (item: RunoutSensor): boolean {
    return filamentSensorRole(this.configfile, item.name) === 'loads'
  }

  /** Only a sensor the printer's settings confirm is runout-only. */
  canTurnOff (item: RunoutSensor): boolean {
    return filamentSensorRole(this.configfile, item.name) === 'runout'
  }

  changeSensor (item: RunoutSensor, value: boolean) {
    const gcode = sensorCommand(item.name, value, this.configfile)
    if (gcode) this.sendGcode(gcode)
  }
}
</script>
