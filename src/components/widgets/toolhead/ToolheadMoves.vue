<template>
  <div>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-12">
        <app-btn-toolhead-move
          :color="(yHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('Y', toolheadMoveLength)"
          :disabled="!yHomed || !klippyReady"
          icon="$up">
        </app-btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <app-btn-toolhead-move
          :color="(zHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('Z', toolheadMoveLength)"
          :disabled="!zHomed || !klippyReady"
          icon="$up">
        </app-btn-toolhead-move>
      </v-col>
      <v-col class="ml-2" v-if="canHomeXY">
        <app-btn-toolhead-move
          :color="(!allHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="!klippyReady || printerPrinting"
          @click="sendGcode('G28', waits.onHomeAll)"
          icon="$home"
          small-icon>
          {{ $t('app.general.btn.all') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto">
        <app-btn-toolhead-move
          :color="(xHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('X', toolheadMoveLength, true)"
          :disabled="!xHomed || !klippyReady"
          icon="$left">
        </app-btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <app-btn-toolhead-move
          :color="(!xyHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeXY)"
          :disabled="!klippyReady || printerPrinting"
          @click="sendGcode('G28 X Y', waits.onHomeXY)"
          :tooltip="$t('app.tool.tooltip.home_xy')"
          icon="$home">
        </app-btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-2" justify="end">
        <app-btn-toolhead-move
          :color="(xHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('X', toolheadMoveLength)"
          :disabled="!xHomed || !klippyReady"
          icon="$right">
        </app-btn-toolhead-move>
      </v-col>
      <v-col cols="auto" v-if="canHomeXY" class="ml-2">
        <app-btn-toolhead-move
          :color="(!zHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeZ)"
          :disabled="!klippyReady || printerPrinting"
          @click="sendGcode('G28 Z', waits.onHomeZ)"
          :tooltip="$t('app.tool.tooltip.home_z')"
          icon="$home">
        </app-btn-toolhead-move>
      </v-col>
      <v-col v-if="canHomeXY"  class="ml-2">
        <app-btn-toolhead-move
          :color="(!xHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeX)"
          :disabled="!klippyReady || printerPrinting"
          @click="sendGcode('G28 X', waits.onHomeX)"
          icon="$home"
          small-icon>
          {{ $t('app.tool.btn.home_x') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col cols="auto" class="ml-12 mr-7">
        <app-btn-toolhead-move
          :color="(yHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('Y', toolheadMoveLength, true)"
          :disabled="!yHomed || !klippyReady"
          icon="$down">
        </app-btn-toolhead-move>
      </v-col>
      <v-col cols="auto" class="ml-7">
        <app-btn-toolhead-move
          :color="(zHomed) ? 'primary' : undefined"
          @click="sendMoveGcode('Z', toolheadMoveLength, true)"
          :disabled="!zHomed || !klippyReady"
          icon="$down">
        </app-btn-toolhead-move>
      </v-col>
      <v-col v-if="canHomeXY" class="ml-2">
        <app-btn-toolhead-move
          :color="(!yHomed) ? 'primary' : undefined"
          :loading="hasWait(waits.onHomeY)"
          :disabled="!klippyReady || printerPrinting"
          @click="sendGcode('G28 Y', waits.onHomeY)"
          icon="$home"
          small-icon>
          {{ $t('app.tool.btn.home_y') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row no-gutters justify="start" class="mb-2">
      <v-col>
        <v-btn-toggle mandatory dense v-model.number="toolheadMoveLength">
          <app-btn small :min-width="40" :value="0.1" :disabled="!klippyReady">0.1</app-btn>
          <app-btn small :min-width="40" class="pa-0" :value="1.0" :disabled="!klippyReady">1.0</app-btn>
          <app-btn small :min-width="40" class="pa-0" :value="10" :disabled="!klippyReady">10</app-btn>
          <app-btn small :min-width="40" class="pa-0" :value="25" :disabled="!klippyReady">25</app-btn>
          <app-btn small :min-width="40" class="pa-0" :value="50" :disabled="!klippyReady">50</app-btn>
          <app-btn small :min-width="40" class="pa-0" :value="100" :disabled="!klippyReady">100</app-btn>
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

@Component({})
export default class ToolheadMoves extends Mixins(StateMixin, ToolheadMixin) {
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
