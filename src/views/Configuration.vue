<template>
  <v-container fluid class="configuration">
    <v-row>
      <v-col cols="12" class="pt-0">
        <v-card>
          <v-card-title>
            <v-icon large left>mdi-tune</v-icon>
            <span class="title font-weight-light text-h5">Printer Configuration</span>
          </v-card-title>
        </v-card>
        <v-row>
          <v-col cols="8" v-if="supportsBedMesh">
            <bed-mesh-widget></bed-mesh-widget>
          </v-col>
          <v-col cols="4">
            <!-- <printer-limits-widget></printer-limits-widget> -->
            <end-stops-widget></end-stops-widget>
            <runout-sensor-widget></runout-sensor-widget>
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

@Component({
  components: {
    PrinterLimitsWidget,
    BedMeshWidget,
    EndStopsWidget,
    RunoutSensorWidget
  }
})
export default class Configuration extends Mixins(UtilsMixin) {
  get supportsBedMesh () {
    return this.$store.getters['socket/getSupportsBedMesh']
  }
}
</script>
