<template>
  <div>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-12">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength)"
          :disabled="hasWaits || !zHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!allHomed) ? 'primary' : 'secondary'"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28', waits.onHomeAll)"
          icon="$home"
          small-icon>
          All
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$left">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          :color="(!xyHomed) ? 'primary' : 'secondary'"
          :loading="hasWait(waits.onHomeXY)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 X Y', waits.onHomeXY)"
          tooltip="Home XY"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$right">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!zHomed) ? 'primary' : 'secondary'"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 Z', waits.onHomeZ)"
          tooltip="Home Z"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!xHomed) ? 'primary' : 'secondary'"
          :loading="hasWait(waits.onHomeX)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 X', waits.onHomeX)"
          icon="$home"
          small-icon>
          X
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-7">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-7">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength, true)"
          :disabled="hasWaits || !zHomed || !klippyConnected"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!yHomed) ? 'primary' : 'secondary'"
          :loading="hasWait(waits.onHomeY)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 Y', waits.onHomeY)"
          icon="$home"
          small-icon>
          Y
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col>
        <v-btn-toggle mandatory dense v-model="toolheadMoveLength">
          <v-btn :min-width="49" color="secondary" value="0.1" :disabled="!klippyConnected">0.1</v-btn>
          <v-btn :min-width="49" class="pa-0" color="secondary" value="1.0" :disabled="!klippyConnected">1.0</v-btn>
          <v-btn :min-width="49" class="pa-0" color="secondary" value="10" :disabled="!klippyConnected">10</v-btn>
          <v-btn :min-width="49" class="pa-0" color="secondary" value="100" :disabled="!klippyConnected">100</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import BtnToolheadMove from '@/components/inputs/BtnToolheadMove.vue'

@Component({
  components: {
    BtnToolheadMove
  }
})
export default class ToolheadMovesWidget extends Mixins(UtilsMixin) {
  waits = Waits
  moveLength = ''
  fab = false

  get kinematics () {
    return this.$store.getters['socket/getPrinterSettings']('printer.kinematics') || ''
  }

  get canHomeXY () {
    return this.kinematics !== 'delta'
  }

  get toolheadMoveLength () {
    return (this.moveLength === '')
      ? this.$store.state.config.uiSettings.general.defaultToolheadMoveLength
      : this.moveLength
  }

  set toolheadMoveLength (val: string) {
    this.moveLength = val
  }
}
</script>

<style type="scss" scoped>
  ::v-deep .v-speed-dial__list {
    flex-direction: column !important;
  }
</style>
