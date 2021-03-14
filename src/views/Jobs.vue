<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" class="pt-0">
        <file-system
          :root="'gcodes'"
          accept=".gcode,.g,.gc,.gco,.ufp,.nc"
          :upload-and-print="true"
          :show-meta-data="true">
        </file-system>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import EndStopsCard from '@/components/cards/configuration/EndStopsCard.vue'
import RunoutSensorsCard from '@/components/cards/configuration/RunoutSensorsCard.vue'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import BedMeshCard from '@/components/cards/configuration/BedMeshCard.vue'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshCard,
    BedMeshWidget,
    EndStopsCard,
    RunoutSensorsCard,
    FileSystem
  }
})
export default class Configuration extends Mixins(StateMixin) {
  get supportsBedMesh () {
    return this.$store.getters['printer/getSupportsBedMesh']
  }
}
</script>
