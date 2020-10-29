<template>
  <div>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto" class="ml-13 mr-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength)"
          :disabled="hasWaits || !zHomed || !klippyConnected"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto">
        <btn-toolhead-move
          @click="sendMoveGcode('X', '-' + toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$left">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-3">
        <btn-toolhead-move
          @click="sendGcode('G28 X Y', waits.onHomeXY)"
          :loading="hasWait(waits.onHomeXY)"
          :disabled="hasWaits || !klippyConnected"
          :color="(!xyHomed) ? 'warning' : 'secondary'"
          icon="$home">
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
        <btn-toolhead-move
          @click="sendGcode('G28 Z', waits.onHomeZ)"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="hasWaits || !klippyConnected"
          :color="(!zHomed) ? 'warning' : 'secondary'"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-3">
      <v-col cols="auto" class="ml-13 mr-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', '-' + toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyConnected"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-8">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', '-' + toolheadMoveLength)"
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
</style>
