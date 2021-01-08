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
      <v-col class="ml-2">
        <v-btn
          :color="(!allHomed) ? 'warning' : 'secondary'"
          :elevation="2"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28', waits.onHomeAll)"
        >
          <v-icon small left>$home</v-icon> All
        </v-btn>
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
          :color="(!xyHomed) ? 'warning' : 'secondary'"
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
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          :color="(!zHomed) ? 'warning' : 'secondary'"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 Z', waits.onHomeZ)"
          tooltip="Home Z"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2">
        <v-btn
          :color="(!xHomed) ? 'warning' : 'secondary'"
          :elevation="2"
          :loading="hasWait(waits.onHomeX)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 X', waits.onHomeX)"
        >
          <v-icon small left>$home</v-icon> X
        </v-btn>
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
      <v-col class="ml-2">
        <v-btn
          :color="(!yHomed) ? 'warning' : 'secondary'"
          :elevation="2"
          :loading="hasWait(waits.onHomeY)"
          :disabled="!klippyConnected || printerPrinting || hasWaits"
          @click="sendGcode('G28 Y', waits.onHomeY)"
        >
          <v-icon small left>$home</v-icon> Y
        </v-btn>
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

  get toolheadMoveLength () {
    return (this.moveLength === '')
      ? this.$store.state.config.fileConfig.general.defaultToolheadMoveLength
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
