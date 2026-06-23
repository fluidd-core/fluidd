<template>
  <v-expansion-panels
    v-model="expanded"
    accordion
    multiple
  >
    <v-expansion-panel
      v-for="sensor in sensors"
      :key="sensor.id"
    >
      <v-expansion-panel-header>
        <template #actions>
          <v-icon
            dense
            class="mr-1"
          >
            $expand
          </v-icon>
        </template>
        <div>
          {{ $filters.prettyCase(sensor.friendly_name) }}

          <v-chip
            v-for="(value, key) in sensor.values"
            :key="`${sensor.id}-${key}`"
            small
            class="ml-2"
          >
            {{ $filters.prettyCase(key.toString()) }}: {{ getFormattedValue(sensor, key.toString(), value) }}
          </v-chip>
        </div>
      </v-expansion-panel-header>

      <v-expansion-panel-content>
        <v-row v-if="getChartableFields(sensor).length">
          <sensor-chart
            v-for="field in getChartableFields(sensor)"
            :key="`${sensor.id}-chart-${field}`"
            :sensor-id="sensor.id"
            :field="field"
            :label="$filters.prettyCase(field)"
            :units="getUnits(sensor, field)"
          />
        </v-row>

        <div
          v-else
          class="text--secondary"
        >
          {{ $t('app.general.label.no_data') }}
        </div>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SensorChart from './SensorChart.vue'

@Component({
  components: {
    SensorChart
  }
})
export default class Sensors extends Vue {
  get sensors (): Moonraker.Sensor.Entry[] {
    return this.$typedGetters['sensors/getSensors']
  }

  get expanded (): number[] {
    const sensors = this.sensors
    const expandedKeys = this.$typedState.sensors.expanded

    return sensors
      .map((sensor, index) => expandedKeys.includes(sensor.id)
        ? index
        : -1)
      .filter(i => i !== -1)
  }

  set expanded (value: number[]) {
    const sensors = this.sensors
    const expandedKeys = value
      .map(index => sensors[index]?.id)
      .filter((id): id is string => id != null)

    this.$typedDispatch('sensors/saveExpanded', expandedKeys)
  }

  getChartableFields (sensor: Moonraker.Sensor.Entry): string[] {
    return Object.entries(sensor.values)
      .filter(([, value]) => typeof value === 'number')
      .map(([key]) => key)
  }

  getUnits (sensor: Moonraker.Sensor.Entry, key: string): string | undefined {
    return sensor.parameter_info?.find(x => x.name === key)?.units
  }

  getFormattedValue (sensor: Moonraker.Sensor.Entry, key: string, value: unknown) {
    if (value == null || value === '') {
      return '--'
    }

    const units = this.getUnits(sensor, key)
    const suffix = units
      ? ` ${units}`
      : ''

    if (typeof value === 'number') {
      return `${Math.round(value * 100) / 100}${suffix}`
    }

    return `${value}${suffix}`
  }
}
</script>
