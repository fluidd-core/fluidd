<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary">
      <v-icon left>{{ icons.printer3dNozzle }}</v-icon>
      <span class="font-weight-light">Toolhead</span>
      <v-spacer />
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('M84')"
        :disabled="hasWaits || !klippyConnected"
        class="mr-2"
        color="secondary">
          MOTORS OFF
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsZtilt"
        @click="sendGcode('Z_TILT_ADJUST', waits.onZTilt)"
        :loading="hasWait(waits.onZTilt)"
        :disabled="hasWaits || !klippyConnected"
        class="mr-2"
        color="secondary">
          Z_TILT_ADJUST
      </v-btn>
      <v-btn
        v-if="!printerPrinting && printerSupportsQgl"
        @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
        :loading="hasWait(waits.onQGL)"
        :disabled="hasWaits || !klippyConnected"
        class="mr-2"
        color="secondary">
          QGL
      </v-btn>
      <v-btn
        v-if="!printerPrinting"
        @click="sendGcode('G28', waits.onHomeAll)"
        :loading="hasWait(waits.onHomeAll)"
        :disabled="hasWaits || !klippyConnected"
        :color="(!allHomed) ? 'warning' : 'secondary'">
          <v-icon small class="mr-1">{{ icons.home }}</v-icon> All
      </v-btn>
    </v-card-title>
    <v-divider></v-divider>

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
}
</script>
