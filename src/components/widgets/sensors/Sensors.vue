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
          {{ $filters.prettyCase(key.toString()) }}: {{ Math.round(value * 100) / 100 }}
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
    return this.$store.getters['sensors/getSensors'] as MoonrakerSensor[]
  }
}
</script>
