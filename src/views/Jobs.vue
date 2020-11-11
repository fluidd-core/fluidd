<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <vue-headful
      :title="pageTitle"
      :head="pageIcon">
    </vue-headful>

    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" class="pt-0">
        <file-system-card
          :root="'gcodes'"
          accept=".gcode, .ufp"
          :show-meta-data="true">
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
  pageName = 'Jobs'
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }
}
</script>
