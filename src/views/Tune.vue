<template>
  <v-row
    v-if="klippyReady"
    :dense="$vuetify.breakpoint.smAndDown"
  >
    <v-col
      v-if="supportsBedMesh"
      cols="12"
      md="8"
    >
      <bed-mesh-card fullscreen />
    </v-col>
    <v-col
      cols="12"
      md="4"
    >
      <bed-mesh-controls
        v-if="supportsBedMesh"
        class="mb-2 mb-md-4"
      />

      <end-stops-card
        v-if="supportsEndStops"
        class="mb-2 mb-md-4"
      />

      <runout-sensors-card
        v-if="supportsRunoutSensors"
        fullscreen
        class="mb-2 mb-md-4"
      />

      <beacon-card
        v-if="supportsBeacon"
        fullscreen
        class="mb-2 mb-md-4"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import BedMeshCard from '@/components/widgets/bedmesh/BedMeshCard.vue'
import BedMeshControls from '@/components/widgets/bedmesh/BedMeshControls.vue'
import EndStopsCard from '@/components/widgets/endstops/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/widgets/runout-sensors/RunoutSensorsCard.vue'
import BeaconCard from '@/components/widgets/beacon/BeaconCard.vue'

@Component({
  components: {
    BedMeshCard,
    BedMeshControls,
    EndStopsCard,
    RunoutSensorsCard,
    BeaconCard
  }
})
export default class Tune extends Mixins(StateMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh']
  }

  get supportsEndStops () {
    return (
      this.$store.getters['printer/getSteppers'].length > 0 ||
      this.$store.getters['printer/getProbe'] != null
    )
  }

  get supportsRunoutSensors () {
    return this.$store.getters['printer/getRunoutSensors'].length > 0
  }

  get supportsEndstops () {
    const endStops = this.$store.getters['printer/getEndstops']
    return (Object.keys(endStops).length > 0)
  }

  get supportsBeacon (): boolean {
    return this.$store.getters['printer/getSupportsBeacon']
  }
}
</script>
