<template>
  <div>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-12">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyReady"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength)"
          :disabled="hasWaits || !zHomed || !klippyReady"
          icon="$up">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!allHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="!klippyReady || printerPrinting || hasWaits"
          @click="sendGcode('G28', waits.onHomeAll)"
          icon="$home"
          small-icon>
          {{ $t('app.general.btn.all') }}
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyReady"
          icon="$left">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          :color="(!xyHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeXY)"
          :disabled="!klippyReady || printerPrinting || hasWaits"
          @click="sendGcode('G28 X Y', waits.onHomeXY)"
          :tooltip="$t('app.tool.tooltip.home_xy')"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <btn-toolhead-move
          @click="sendMoveGcode('X', toolheadMoveLength)"
          :disabled="hasWaits || !xyHomed || !klippyReady"
          icon="$right">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!zHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="!klippyReady || printerPrinting || hasWaits"
          @click="sendGcode('G28 Z', waits.onHomeZ)"
          :tooltip="$t('app.tool.tooltip.home_z')"
          icon="$home">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!xHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeX)"
          :disabled="!klippyReady || printerPrinting || hasWaits"
          @click="sendGcode('G28 X', waits.onHomeX)"
          icon="$home"
          small-icon>
          {{ $t('app.tool.btn.home_x') }}
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-7">
        <btn-toolhead-move
          @click="sendMoveGcode('Y', toolheadMoveLength, true)"
          :disabled="hasWaits || !xyHomed || !klippyReady"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-7">
        <btn-toolhead-move
          @click="sendMoveGcode('Z', toolheadMoveLength, true)"
          :disabled="hasWaits || !zHomed || !klippyReady"
          icon="$down">
        </btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <btn-toolhead-move
          :color="(!yHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeY)"
          :disabled="!klippyReady || printerPrinting || hasWaits"
          @click="sendGcode('G28 Y', waits.onHomeY)"
          icon="$home"
          small-icon>
          {{ $t('app.tool.btn.home_y') }}
        </btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col>
        <v-btn-toggle mandatory dense v-model.number="toolheadMoveLength">
          <btn :min-width="49" :value="0.1" :disabled="!klippyReady">0.1</btn>
          <btn :min-width="49" class="pa-0" :value="1.0" :disabled="!klippyReady">1.0</btn>
          <btn :min-width="49" class="pa-0" :value="10" :disabled="!klippyReady">10</btn>
          <btn :min-width="49" class="pa-0" :value="100" :disabled="!klippyReady">100</btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { Waits } from '@/globals'
import BtnToolheadMove from '@/components/inputs/BtnToolheadMove.vue'

@Component({
  components: {
    BtnToolheadMove
  }
})
export default class ToolheadMovesWidget extends Mixins(StateMixin, ToolheadMixin) {
  waits = Waits
  moveLength = ''
  fab = false

  get kinematics () {
    return this.$store.getters['printer/getPrinterSettings']('printer.kinematics') || ''
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

  /**
   * Send a move gcode script.
   */
  sendMoveGcode (axis: string, distance: string, negative = false) {
    axis = axis.toLowerCase()
    const rate = (axis.toLowerCase() === 'z')
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
    const inverted = this.$store.state.config.uiSettings.general.axis[axis].inverted || false
    distance = ((negative && !inverted) || (!negative && inverted))
      ? '-' + distance
      : distance

    this.sendGcode(`G91
      G1 ${axis}${distance} F${rate * 60}
      G90`)
  }
}
</script>

<style type="scss" scoped>
  ::v-deep .v-speed-dial__list {
    flex-direction: column !important;
  }
</style>
