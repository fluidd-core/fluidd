<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <vue-headful
      :title="pageTitle">
    </vue-headful>

    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="7" class="pt-0">
        <klippy-disconnected-card v-if="!klippyConnected"></klippy-disconnected-card>
        <bed-mesh-card v-if="supportsBedMesh && klippyConnected"></bed-mesh-card>
        <v-row v-if="klippyConnected">
          <v-col cols="12" sm="6" class="pt-0">
            <runout-sensors-card v-if="klippyConnected"></runout-sensors-card>
          </v-col>
          <v-col cols="12" sm="6" class="pt-0">
            <end-stops-card v-if="klippyConnected"></end-stops-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="5" class="pt-0 config-files-wrapper">
        <file-system-card
          :root="['config', 'config_examples']"
          accept=".conf,.cfg"
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
// import { MetaInfo } from 'vue-meta'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshCard,
    BedMeshWidget,
    EndStopsCard,
    RunoutSensorsCard,
    FileSystemCard,
    KlippyDisconnectedCard
  }
  // metaInfo (this: Configuration): MetaInfo {
  //   return {
  //     title: 'Configuration'
  //   }
  // }
})
export default class Configuration extends Mixins(UtilsMixin) {
  pageName = 'Configuration'
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }
}
</script>
