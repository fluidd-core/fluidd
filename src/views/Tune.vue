<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0" v-if="!klippyReady || hasWarnings">
        <klippy-status-card></klippy-status-card>
      </v-col>
      <v-col cols="12" md="6" class="pt-0" v-if="supportsBedMesh && klippyReady">
        <bed-mesh-card></bed-mesh-card>
      </v-col>
      <v-col cols="12" md="3" class="pt-0">
        <end-stops-card></end-stops-card>
      </v-col>
      <v-col cols="12" md="3" class="pt-0" v-if="supportsRunoutSensors">
        <runout-sensors-card></runout-sensors-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import BedMeshCard from '@/components/widgets/bedmesh/BedMeshCard.vue'
import EndStopsCard from '@/components/widgets/endstops/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/widgets/runout-sensors/RunoutSensorsCard.vue'

@Component({
  components: {
    BedMeshCard,
    EndStopsCard,
    RunoutSensorsCard
  }
})
export default class Tune extends Mixins(StateMixin) {
  get supportsBedMesh () {
    return this.$store.getters['printer/getSupportsBedMesh']
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
