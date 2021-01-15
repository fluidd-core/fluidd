<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="7" class="pt-0">
        <klippy-disconnected-card></klippy-disconnected-card>
        <bed-mesh-card v-if="supportsBedMesh && klippyConnected"></bed-mesh-card>
        <v-row>
          <v-col cols="12" sm="6" v-if="klippyConnected">
            <logs-card></logs-card>
            <!-- <bed-adjust-card></bed-adjust-card> -->
          </v-col>
          <v-col cols="12" sm="6" v-if="klippyConnected">
            <end-stops-card></end-stops-card>
            <runout-sensors-card v-if="supportsRunoutSensors"></runout-sensors-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="5" class="pt-0 config-files-wrapper">
        <file-system-card
          :root="['config', 'config_examples']"
          accept=".conf,.cfg,.md"
          :upload-and-print="false"
          :file-create="true"
          dense
          panel-title="Config"
          :show-meta-data="false">
        </file-system-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import EndStopsCard from '@/components/cards/configuration/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/cards/configuration/RunoutSensorsCard.vue'
import FileSystemCard from '@/components/cards/FileSystemCard.vue'
import KlippyDisconnectedCard from '@/components/cards/KlippyDisconnectedCard.vue'
import BedMeshCard from '@/components/cards/configuration/BedMeshCard.vue'
import BedAdjustCard from '@/components/cards/configuration/BedAdjustCard.vue'
import LogsCard from '@/components/cards/configuration/LogsCard.vue'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshCard,
    BedMeshWidget,
    BedAdjustCard,
    EndStopsCard,
    RunoutSensorsCard,
    FileSystemCard,
    KlippyDisconnectedCard,
    LogsCard
  }
})
export default class Configuration extends Mixins(UtilsMixin) {
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }

  get supportsRunoutSensors () {
    return this.$store.getters['socket/getRunoutSensors'].length
  }

  get supportsEndstops () {
    const endStops = this.$store.getters['socket/getEndstops']
    return (Object.keys(endStops).length > 0)
  }
}
</script>
