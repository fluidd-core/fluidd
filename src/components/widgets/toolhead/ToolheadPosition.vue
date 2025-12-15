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
        <app-text-field
          :color="forceMoveEnabled ? 'error' : 'primary'"
          :label="`X [ ${livePosition[0].toFixed(2)} ]`"
          :rules="[
            $rules.required,
            $rules.numberValid
          ]"
          outlined
          persistent-placeholder
          hide-details
          dense
          small
          type="number"
          :disabled="!klippyReady || (!xHomed && !xForceMove)"
          :readonly="printerPrinting"
          :value="(useGcodeCoords) ? gcodePosition[0].toFixed(2) : toolheadPosition[0].toFixed(2)"
          @submit="moveAxisTo('X', +$event)"
        />
      </v-col>
      <v-col
        cols="3"
        class="pr-1 pl-1"
      >
        <app-text-field
          :color="forceMoveEnabled ? 'error' : 'primary'"
          :label="`Y [ ${livePosition[1].toFixed(2)} ]`"
          :rules="[
            $rules.required,
            $rules.numberValid
          ]"
          outlined
          persistent-placeholder
          hide-details
          dense
          small
          type="number"
          :disabled="!klippyReady || (!yHomed && !yForceMove)"
          :readonly="printerPrinting"
          :value="(useGcodeCoords) ? gcodePosition[1].toFixed(2) : toolheadPosition[1].toFixed(2)"
          @submit="moveAxisTo('Y', +$event)"
        />
      </v-col>
      <v-col
        cols="3"
        class="pr-1 pl-1"
      >
        <app-text-field
          :color="forceMoveEnabled ? 'error' : 'primary'"
          :label="`Z [ ${livePosition[2].toFixed(3)} ]`"
          :rules="[
            $rules.required,
            $rules.numberValid
          ]"
          outlined
          persistent-placeholder
          hide-details
          dense
          small
          type="number"
          :disabled="!klippyReady || (!zHomed && !zForceMove)"
          :readonly="printerPrinting"
          :value="(useGcodeCoords) ? gcodePosition[2].toFixed(3) : toolheadPosition[2].toFixed(3)"
          @submit="moveAxisTo('Z', +$event)"
        />
      </v-col>
      <v-col
        cols="3"
        class="pl-1"
      >
        <app-btn-toggle
          v-model="positioning"
          mandatory
          dense
          class="d-flex"
          :disabled="!klippyReady || printerPrinting"
        >
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                class="positioning-toggle-button"
                :disabled="!klippyReady || printerPrinting"
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
                :disabled="!klippyReady || printerPrinting"
                v-on="on"
              >
                <v-icon small>
                  $relativePositioning
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t('app.tool.tooltip.relative_positioning') }}</span>
          </v-tooltip>
        </app-btn-toggle>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

type Axis = 'X' | 'Y' | 'Z'

const axisIndexMap: Record<Axis, number> = {
  X: 0,
  Y: 1,
  Z: 2
}

@Component({})
export default class ToolheadPosition extends Mixins(StateMixin, ToolheadMixin) {
  get gcodePosition (): [number, number, number, number] {
    return this.$typedState.printer.printer.gcode_move.gcode_position
  }

  get toolheadPosition (): [number, number, number, number] {
    return this.$typedState.printer.printer.toolhead.position
  }

  get livePosition (): [number, number, number, number] {
    return this.$typedState.printer.printer.motion_report?.live_position ?? [0, 0, 0, 0]
  }

  get useGcodeCoords (): boolean {
    return this.$typedState.config.uiSettings.general.useGcodeCoords
  }

  get xForceMove (): boolean {
    return this.forceMoveEnabled && !this.xHasMultipleSteppers
  }

  get yForceMove (): boolean {
    return this.forceMoveEnabled && !this.yHasMultipleSteppers
  }

  get zForceMove (): boolean {
    return this.forceMoveEnabled && !this.zHasMultipleSteppers
  }

  get usesAbsolutePositioning (): boolean {
    return this.$typedState.printer.printer.gcode_move.absolute_coordinates
  }

  get positioning () {
    return this.usesAbsolutePositioning ? 0 : 1
  }

  set positioning (value: number) {
    this.sendGcode(`G9${value}`)
  }

  get printerSettings (): Klipper.SettingsState {
    return this.$typedGetters['printer/getPrinterSettings']
  }

  moveAxisTo (axis: Axis, pos: number) {
    const axisIndex = axisIndexMap[axis]
    const currentPos = this.useGcodeCoords
      ? this.gcodePosition[axisIndex]
      : this.toolheadPosition[axisIndex]

    if (currentPos !== pos) {
      const rate: number = axis === 'Z'
        ? this.$typedState.config.uiSettings.general.defaultToolheadZSpeed
        : this.$typedState.config.uiSettings.general.defaultToolheadXYSpeed

      if (this.forceMoveEnabled) {
        const accel: number = axis === 'Z'
          ? this.printerSettings.printer?.max_z_accel ?? 100
          : this.$typedState.printer.printer.toolhead.max_accel
        this.sendGcode(`FORCE_MOVE STEPPER=stepper_${axis.toLowerCase()} DISTANCE=${pos} VELOCITY=${rate} ACCEL=${accel}`)
      } else {
        this.sendMoveGcode(
          {
            [axis]: pos
          },
          rate,
          true)
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
