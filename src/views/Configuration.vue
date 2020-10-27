<template>
  <v-container fluid class="configuration">
    <v-row>
      <v-col cols="12" class="pt-0">
        <v-card color="quaternary">
          <v-card-title color="quaternary">
            <v-icon large left>$tune</v-icon>
            <span class="font-weight-light">Printer Configuration</span>
          </v-card-title>
        </v-card>
        <v-row>
          <v-col cols="12" md="7">
            <klippy-disconnected-widget v-if="!klippyConnected"></klippy-disconnected-widget>
            <bed-mesh-widget v-if="supportsBedMesh && klippyConnected"></bed-mesh-widget>
            <v-row v-if="klippyConnected">
              <v-col cols="12" sm="6">
                <runout-sensor-widget></runout-sensor-widget>
              </v-col>
              <v-col cols="12" sm="6">
                <end-stops-widget></end-stops-widget>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="5" class="config-files-wrapper">
            <file-system-widget
              :root="['config', 'config_examples']"
              accept=".conf,.cfg"
              panel-title="Config"
              :show-meta-data="false">
            </file-system-widget>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import EndStopsWidget from '@/components/widgets/configuration/EndStopsWidget.vue'
import RunoutSensorWidget from '@/components/widgets/configuration/RunoutSensorWidget.vue'
import FileSystemWidget from '@/components/widgets/filesystem/FileSystemWidget.vue'
import KlippyDisconnectedWidget from '@/components/widgets/configuration/KlippyDisconnectedWidget.vue'
import { MetaInfo } from 'vue-meta'

const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshWidget,
    EndStopsWidget,
    RunoutSensorWidget,
    FileSystemWidget,
    KlippyDisconnectedWidget
  },
  metaInfo (this: Configuration): MetaInfo {
    return {
      title: 'Configuration'
    }
  }
})
export default class Configuration extends Mixins(UtilsMixin) {
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }
}
</script>

<style lang="scss" scoped>
  .config-files-wrapper {
    height: 600px;
  }
</style>
