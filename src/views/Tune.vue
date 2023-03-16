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
      <bed-mesh-card full-screen />
    </v-col>
    <v-col
      cols="12"
      md="4"
    >
      <bed-mesh-controls
        v-if="supportsBedMesh"
        class="mb-2 mb-sm-4"
      />
      <end-stops-card class="mb-2 mb-sm-4" />
      <runout-sensors-card v-if="supportsRunoutSensors" />
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

@Component({
  components: {
    BedMeshCard,
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
