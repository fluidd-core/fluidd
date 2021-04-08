<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="8" class="pt-0" v-if="!klippyReady || hasWarnings">
        <klippy-status-card></klippy-status-card>
      </v-col>
      <v-col cols="12" md="8" class="pt-0" v-if="supportsBedMesh && klippyReady">
        <bed-mesh></bed-mesh>
      </v-col>
      <v-col cols="12" md="4" class="pt-0">
        <bed-mesh-controls v-if="supportsBedMesh && klippyReady"></bed-mesh-controls>
        <end-stops-card></end-stops-card>
        <runout-sensors-card v-if="supportsRunoutSensors"></runout-sensors-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import BedMesh from '@/components/widgets/bedmesh/BedMesh.vue'
import BedMeshControls from '@/components/widgets/bedmesh/BedMeshControls.vue'
import EndStopsCard from '@/components/widgets/endstops/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/widgets/runout-sensors/RunoutSensorsCard.vue'

@Component({
  components: {
    BedMesh,
    BedMeshControls,
    EndStopsCard,
    RunoutSensorsCard
  }
})
export default class Tune extends Mixins(StateMixin) {
  get supportsBedMesh () {
    return this.$store.getters['mesh/getSupportsBedMesh']
  }

  get supportsRunoutSensors () {
    return this.$store.getters['printer/getRunoutSensors'].length
  }

  get supportsEndstops () {
    const endStops = this.$store.getters['printer/getEndstops']
    return (Object.keys(endStops).length > 0)
  }
}
</script>
