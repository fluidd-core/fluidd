<template>
  <v-card class="mb-4">
    <v-card-title >
      <v-icon large left>mdi-printer-3d-nozzle-outline</v-icon>
      <span class="title font-weight-light text-h5">Toolhead</span>
      <v-spacer />
      <v-btn
        v-if="!printerPrinting && printerSupportsZtilt"
        @click="sendGcode('Z_TILT', waits.onZTilt)"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits"
        class="mr-2"
        color="secondary">
          Z_TILT
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits"
        class="mr-2"
        color="secondary">
          QGL
      </v-btn>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('G28', waits.onHomeAll)"
        :loading="hasWait(waits.onHomeAll)"
        :disabled="hasWaits"
        :color="(!allHomed) ? 'warning' : 'secondary'">
          <v-icon>mdi-home</v-icon> All
      </v-btn>
    </v-card-title>
    <toolhead-widget></toolhead-widget>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import ToolheadWidget from '@/components/widgets/ToolheadWidget.vue'
import { Waits } from '@/globals'

@Component({
  components: {
    ToolheadWidget
  }
})
export default class ToolheadCard extends Mixins(UtilsMixin) {
  waits = Waits

  get printerSupportsQgl (): boolean {
    return 'quad_gantry_level' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsZtilt (): boolean {
    return 'z_tilt' in this.$store.state.socket.printer.configfile.config
  }

  get allHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('xyz')
  }
}
</script>
