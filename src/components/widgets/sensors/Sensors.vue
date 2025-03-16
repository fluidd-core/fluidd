<template>
  <v-container>
    <v-row
      v-for="sensor in sensors"
      :key="sensor.id"
    >
      <v-col>
        {{ $filters.prettyCase(sensor.friendly_name) }}

        <v-chip
          v-for="(value, key) in sensor.values"
          :key="`${sensor.id}-${key}`"
          small
          class="ml-2"
        >
          {{ $filters.prettyCase(key.toString()) }}: {{ getFormattedValue(sensor, key.toString(), value) }}
        </v-chip>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import type { MoonrakerSensor } from '@/store/sensors/types'
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class Sensors extends Vue {
  get sensors (): MoonrakerSensor[] {
    return this.$typedGetters['sensors/getSensors']
  }

  getFormattedValue (sensor: MoonrakerSensor, key: string, value: unknown) {
    if (value == null || value === '') {
      return '--'
    }

    const parameterUnits = sensor.parameter_info?.find(x => x.name === key)?.units
    const units = parameterUnits
      ? ` ${parameterUnits}`
      : ''

    if (typeof value === 'number') {
      return `${Math.round(value * 100) / 100}${units}`
    }

    return `${value}${units}`
  }
}
</script>
