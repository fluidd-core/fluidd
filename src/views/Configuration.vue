<template>
  <v-container fluid class="configuration">
    <v-row>
      <v-col cols="12" class="pt-0">
        <v-card>
          <v-card-title>
            <v-icon large left>mdi-tune</v-icon>
            <span class="font-weight-light">Printer Configuration</span>
          </v-card-title>
        </v-card>
        <v-row>
          <v-col cols="7" v-if="supportsBedMesh">
            <bed-mesh-widget></bed-mesh-widget>
            <v-row>
              <v-col cols="6">
                <runout-sensor-widget></runout-sensor-widget>
              </v-col>
              <v-col cols="6">
                <end-stops-widget></end-stops-widget>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="5">
            <!-- <printer-limits-widget></printer-limits-widget> -->
            <v-card>
              <file-system-widget
                :root="['config', 'config_examples']"
                accept=".conf,.cfg"
                panel-title="Config"
                :show-meta-data="false">
              </file-system-widget>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import PrinterLimitsWidget from '@/components/widgets/configuration/PrinterLimitsWidget.vue'
import BedMeshWidget from '@/components/widgets/configuration/BedMeshWidget.vue'
import EndStopsWidget from '@/components/widgets/configuration/EndStopsWidget.vue'
import RunoutSensorWidget from '@/components/widgets/configuration/RunoutSensorWidget.vue'
import FileSystemWidget from '@/components/widgets/filesystem/FileSystemWidget.vue'

@Component({
  components: {
    PrinterLimitsWidget,
    BedMeshWidget,
    EndStopsWidget,
    RunoutSensorWidget,
    FileSystemWidget
  }
})
export default class Configuration extends Mixins(UtilsMixin) {
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }
}
</script>
