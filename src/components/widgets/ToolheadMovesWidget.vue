<template>
  <div>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto" class="ml-13 mr-13">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-3">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength)"
          :disabled="hasWaits || !zHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto" class="mr-13">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$left">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-3">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$right">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-3">
        <v-speed-dial
          v-model="fab"
          direction="right"
          open-on-hover
          transition="slide-y-reverse-transition"
        >
        <template v-slot:activator>
          <v-btn
            v-model="fab"
            class="px-0"
            :min-width="40"
            :loading="hasWait([waits.onHomeAll, waits.onHomeX, waits.onHomeY, waits.onHomeZ])"
            :color="(!allHomed) ? 'warning' : 'secondary'"
          >
            <v-icon v-if="fab">
              $close
            </v-icon>
            <v-icon v-else>
              $home
            </v-icon>
          </v-btn>
        </template>
        <v-btn
          :color="(!allHomed) ? 'warning' : 'secondary'"
          small
          :elevation="2"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="!klippyConnected || printerPrinting || hasWait([waits.onHomeAll, waits.onHomeX, waits.onHomeY, waits.onHomeZ])"
          @click="sendGcode('G28', waits.onHomeAll)"
        >
          <v-icon small>$home</v-icon> All
        </v-btn>
        <v-btn
          :color="(!xHomed) ? 'warning' : 'secondary'"
          small
          :elevation="2"
          :loading="hasWait(waits.onHomeX)"
          :disabled="!klippyConnected || printerPrinting || hasWait([waits.onHomeAll, waits.onHomeX, waits.onHomeY, waits.onHomeZ])"
          @click="sendGcode('G28 X', waits.onHomeX)"
        >
          <v-icon small>$home</v-icon> X
        </v-btn>
        <v-btn
          :color="(!yHomed) ? 'warning' : 'secondary'"
          small
          :elevation="2"
          :loading="hasWait(waits.onHomeY)"
          :disabled="!klippyConnected || printerPrinting || hasWait([waits.onHomeAll, waits.onHomeX, waits.onHomeY, waits.onHomeZ])"
          @click="sendGcode('G28 Y', waits.onHomeY)"
        >
          <v-icon small>$home</v-icon> Y
        </v-btn>
        <v-btn
          :color="(!zHomed) ? 'warning' : 'secondary'"
          small
          :elevation="2"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="!klippyConnected || printerPrinting || hasWait([waits.onHomeAll, waits.onHomeX, waits.onHomeY, waits.onHomeZ])"
          @click="sendGcode('G28 Z', waits.onHomeZ)"
        >
          <v-icon small>$home</v-icon> Z
        </v-btn>
      </v-speed-dial>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto" class="ml-13 mr-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength, true)"
          :disabled="hasWaits || !zHomed || !klippyConnected"
          icon="$down">
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
