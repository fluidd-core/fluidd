<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0" v-if="!klippyReady || hasWarnings">
        <klippy-card></klippy-card>
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
import EndStopsCard from '@/components/cards/configuration/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/cards/configuration/RunoutSensorsCard.vue'
import KlippyCard from '@/components/cards/KlippyCard.vue'
import BedMeshCard from '@/components/cards/configuration/BedMeshCard.vue'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshCard,
    BedMeshWidget,
    EndStopsCard,
    RunoutSensorsCard,
    KlippyCard
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
