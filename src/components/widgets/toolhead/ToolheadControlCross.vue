<template>
  <div>
    <v-row
      no-gutters
      justify="start"
      class="mb-2"
    >
      <v-col
        cols="auto"
        class="ml-12 mr-12"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(yHomed)"
          :disabled="axisButtonDisabled(yHomed, yHasMultipleSteppers)"
          icon="$up"
          @click="moveAxisBy('Y', toolheadMoveLength)"
        />
      </v-col>
      <v-col
        cols="auto"
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(zHomed)"
          :disabled="axisButtonDisabled(zHomed, zHasMultipleSteppers)"
          icon="$up"
          @click="moveAxisBy('Z', toolheadMoveLength)"
        />
      </v-col>
      <v-col
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="(!allHomed) ? 'primary' : undefined"
          :loading="hasWait($waits.onHomeAll)"
          :disabled="!klippyReady || printerPrinting"
          icon="$home"
          small-icon
          @click="homeAll"
        >
          {{ $t('app.tool.btn.home_all') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      justify="start"
      class="mb-2"
    >
      <v-col
        cols="auto"
        :class="{
          'mr-12': !canHomeXY,
        }"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(xHomed)"
          :disabled="axisButtonDisabled(xHomed, xHasMultipleSteppers)"
          icon="$left"
          @click="moveAxisBy('X', toolheadMoveLength, true)"
        />
      </v-col>
      <v-col
        v-if="canHomeXY"
        cols="auto"
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="(!xyHomed) ? 'primary' : undefined"
          :loading="hasWait($waits.onHomeXY)"
          :disabled="!klippyReady || printerPrinting"
          :tooltip="$t('app.tool.tooltip.home_xy')"
          icon="$home"
          @click="sendGcode('G28 X Y', $waits.onHomeXY)"
        />
      </v-col>
      <v-col
        cols="auto"
        class="ml-2"
        justify="end"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(xHomed)"
          :disabled="axisButtonDisabled(xHomed, xHasMultipleSteppers)"
          icon="$right"
          @click="moveAxisBy('X', toolheadMoveLength)"
        />
      </v-col>
      <v-col
        v-if="canHomeXY"
        cols="auto"
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="(!zHomed) ? 'primary' : undefined"
          :loading="hasWait($waits.onHomeZ)"
          :disabled="!klippyReady || printerPrinting"
          :tooltip="$t('app.tool.tooltip.home_z')"
          icon="$home"
          @click="sendGcode('G28 Z', $waits.onHomeZ)"
        />
      </v-col>
      <v-col
        v-if="canHomeXY"
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="(!xHomed) ? 'primary' : undefined"
          :loading="hasWait($waits.onHomeX)"
          :disabled="!klippyReady || printerPrinting"
          icon="$home"
          small-icon
          @click="sendGcode('G28 X', $waits.onHomeX)"
        >
          {{ $t('app.tool.btn.home_x') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      justify="start"
      class="mb-2"
    >
      <v-col
        cols="auto"
        class="ml-12 mr-7"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(yHomed)"
          :disabled="axisButtonDisabled(yHomed, yHasMultipleSteppers)"
          icon="$down"
          @click="moveAxisBy('Y', toolheadMoveLength, true)"
        />
      </v-col>
      <v-col
        cols="auto"
        class="ml-7"
      >
        <app-btn-toolhead-move
          :color="axisButtonColor(zHomed)"
          :disabled="axisButtonDisabled(zHomed, zHasMultipleSteppers)"
          icon="$down"
          @click="moveAxisBy('Z', toolheadMoveLength, true)"
        />
      </v-col>
      <v-col
        v-if="canHomeXY"
        class="ml-2"
      >
        <app-btn-toolhead-move
          :color="(!yHomed) ? 'primary' : undefined"
          :loading="hasWait($waits.onHomeY)"
          :disabled="!klippyReady || printerPrinting"
          icon="$home"
          small-icon
          @click="sendGcode('G28 Y', $waits.onHomeY)"
        >
          {{ $t('app.tool.btn.home_y') }}
        </app-btn-toolhead-move>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      justify="start"
      class="mb-2"
    >
      <v-col>
        <v-btn-toggle
          v-model.number="toolheadMoveLength"
          mandatory
          dense
          class="elevation-2"
        >
          <app-btn
            v-for="(distance, index) of toolheadMoveDistances"
            :key="index"
            small
            min-width="40"
            :value="distance"
            :disabled="!klippyReady"
          >
            {{ distance }}
          </app-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

type Axis = 'X' | 'Y' | 'Z'

@Component({})
export default class ToolheadControlCross extends Mixins(StateMixin, ToolheadMixin) {
  moveLength: number | null = null

  get forceMove (): boolean {
    return this.$store.state.config.uiSettings.toolhead.forceMove as boolean
  }

  get hasRoundBed (): boolean {
    return this.$store.getters['printer/getHasRoundBed'] as boolean
  }

  get canHomeXY (): boolean {
    return !this.hasRoundBed
  }

  get toolheadMoveDistances (): number[] {
    return this.$store.state.config.uiSettings.general.toolheadMoveDistances as number[]
  }

  get toolheadMoveLength (): number {
    if (this.moveLength == null) {
      const defaultToolheadMoveLength = this.$store.state.config.uiSettings.general.defaultToolheadMoveLength as number

      this.moveLength = this.toolheadMoveDistances.includes(defaultToolheadMoveLength)
        ? defaultToolheadMoveLength
        : this.toolheadMoveDistances[0]
    }

    return this.moveLength
  }

  set toolheadMoveLength (val: number) {
    this.moveLength = val
  }

  axisButtonColor (axisHomed: boolean): string | undefined {
    if (this.forceMove) return 'error'

    return axisHomed ? 'primary' : undefined
  }

  axisButtonDisabled (axisHomed: boolean, axisMultipleSteppers: boolean): boolean {
    return !this.klippyReady || (!axisHomed && !(this.forceMove && !axisMultipleSteppers))
  }

  /**
   * Send a move gcode script.
   */
  moveAxisBy (axis: Axis, distance: number, negative = false) {
    const rate = axis === 'Z'
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
    const inverted = this.$store.state.config.uiSettings.general.axis[axis.toLowerCase()].inverted || false
    distance = negative !== inverted
      ? -distance
      : distance

    if (this.forceMove) {
      const accel = axis === 'Z'
        ? this.$store.getters['printer/getPrinterSettings']('printer.max_z_accel')
        : this.$store.state.printer.printer.toolhead.max_accel
      this.sendGcode(`FORCE_MOVE STEPPER=stepper_${axis.toLowerCase()} DISTANCE=${distance} VELOCITY=${rate} ACCEL=${accel}`)
    } else {
      this.sendMoveGcode(`${axis}${distance}`, rate)
    }
  }
}
</script>

<style type="scss" scoped>
  :deep(.v-speed-dial__list) {
    flex-direction: column !important;
  }
</style>
