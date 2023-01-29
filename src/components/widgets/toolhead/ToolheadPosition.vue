<template>
  <div class="mb-2">
    <!-- <div style="line-height: 32px; padding: 0 12px;"> -->
    <v-row
      justify="space-between"
      no-gutters
    >
      <v-col
        cols="3"
        class="pr-1"
      >
        <v-text-field
          :color="(forceMove) ? 'error' : 'primary'"
          :label="`X [ ${livePosition[0].toFixed(2)} ]`"
          outlined
          hide-details
          dense
          class="v-input--width-small"
          type="number"
          :disabled="!klippyReady || (!xHomed && !xForceMove)"
          :readonly="printerBusy"
          :value="(useGcodeCoords) ? gcodePosition[0].toFixed(2) : toolheadPosition[0].toFixed(2)"
          @change="moveTo('X', $event)"
          @focus="$event.target.select()"
        />
      </v-col>
      <v-col
        cols="3"
        class="pr-1 pl-1"
      >
        <v-text-field
          :color="(forceMove) ? 'error' : 'primary'"
          :label="`Y [ ${livePosition[1].toFixed(2)} ]`"
          outlined
          hide-details
          dense
          class="v-input--width-small"
          type="number"
          :disabled="!klippyReady || (!yHomed && !yForceMove)"
          :readonly="printerBusy"
          :value="(useGcodeCoords) ? gcodePosition[1].toFixed(2) : toolheadPosition[1].toFixed(2)"
          @change="moveTo('Y', $event)"
          @focus="$event.target.select()"
        />
      </v-col>
      <v-col
        cols="3"
        class="pr-1 pl-1"
      >
        <v-text-field
          :color="(forceMove) ? 'error' : 'primary'"
          :label="`Z [ ${livePosition[2].toFixed(2)} ]`"
          outlined
          hide-details
          dense
          class="v-input--width-small"
          type="number"
          :disabled="!klippyReady || (!zHomed && !zForceMove)"
          :readonly="printerBusy"
          :value="(useGcodeCoords) ? gcodePosition[2].toFixed(2) : toolheadPosition[2].toFixed(2)"
          @change="moveTo('Z', $event)"
          @focus="$event.target.select()"
        />
      </v-col>
      <v-col
        cols="3"
        class="pl-1"
      >
        <v-btn-toggle
          v-model="positioning"
          mandatory
          dense
          class="d-block"
        >
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                class="positioning-toggle-button"
                :disabled="!klippyReady || printerBusy"
                :elevation="2"
                v-on="on"
              >
                <v-icon small>
                  $absolutePositioning
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t('app.tool.tooltip.absolute_positioning') }}</span>
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                class="positioning-toggle-button"
                :disabled="!klippyReady || printerBusy"
                :elevation="2"
                v-on="on"
              >
                <v-icon small>
                  $relativePositioning
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t('app.tool.tooltip.relative_positioning') }}</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row
      v-show="printerPrinting"
      justify="space-between"
      align="center"
      no-gutters
    >
      <v-col
        cols="auto"
        class="secondary--text text--lighten-1"
      >
        {{ $t('app.general.label.requested_speed') }} [ {{ liveVelocity.toFixed(2) }} mm/s ]
      </v-col>
      <v-col
        cols="auto"
        class="focus--text"
      >
        {{ requestedSpeed }} mm/s
      </v-col>
    </v-row>

    <!-- </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class ToolheadPosition extends Mixins(StateMixin, ToolheadMixin) {
  get gcodePosition () {
    return this.$store.state.printer.printer.gcode_move.gcode_position
  }

  get toolheadPosition () {
    return this.$store.state.printer.printer.toolhead.position
  }

  get livePosition () {
    return this.$store.state.printer.printer.motion_report.live_position
  }

  get liveVelocity () {
    return this.$store.state.printer.printer.motion_report.live_velocity
  }

  get useGcodeCoords () {
    return this.$store.state.config.uiSettings.general.useGcodeCoords
  }

  get forceMove () {
    return this.$store.state.config.uiSettings.toolhead.forceMove
  }

  get xForceMove () {
    return this.forceMove && !this.xHasMultipleSteppers
  }

  get yForceMove () {
    return this.forceMove && !this.yHasMultipleSteppers
  }

  get zForceMove () {
    return this.forceMove && !this.zHasMultipleSteppers
  }

  get requestedSpeed () {
    // Take into account the speed multiplier.
    const multiplier = this.$store.state.printer.printer.gcode_move.speed_factor || 1
    let speed = this.$store.state.printer.printer.gcode_move.speed || 0
    speed = (speed * multiplier) / 60
    return speed.toFixed()
  }

  get usesAbsolutePositioning () {
    return this.$store.state.printer.printer.gcode_move.absolute_coordinates
  }

  get positioning () {
    return this.usesAbsolutePositioning ? 0 : 1
  }

  set positioning (value: number) {
    this.sendGcode(`G9${value}`)
  }

  moveTo (axis: string, pos: string) {
    const axisIndexMap: any = { X: 0, Y: 1, Z: 2 }
    const currentPos = (this.useGcodeCoords)
      ? this.gcodePosition[axisIndexMap[axis]]
      : this.toolheadPosition[axisIndexMap[axis]]
    if (parseInt(currentPos) !== parseInt(pos)) {
      const rate = (axis.toLowerCase() === 'z')
        ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
        : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
      if (this.forceMove) {
        const accel = (axis.toLowerCase() === 'z')
          ? this.$store.getters['printer/getPrinterSettings']('printer.max_z_accel')
          : this.$store.state.printer.printer.toolhead.max_accel
        this.sendGcode(`FORCE_MOVE STEPPER=stepper_${axis.toLowerCase()} DISTANCE=${pos} VELOCITY=${rate} ACCEL=${accel}`)
      } else {
        this.sendGcode(`G90
        G1 ${axis}${pos} F${rate * 60}`)
      }
    }
  }
}
</script>

<style type="scss" scoped>
  .positioning-toggle-button {
    min-width: 20px !important;
    width: 50%;
  }
</style>
