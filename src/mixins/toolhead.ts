import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import type { Extruder, KlipperPrinterSettings } from '@/store/printer/types'

@Component
export default class ToolheadMixin extends Vue {
  get hasExtruder (): boolean {
    return this.$typedGetters['printer/getHasExtruder']
  }

  get hasMultipleExtruders (): boolean {
    return this.$typedGetters['printer/getHasMultipleExtruders']
  }

  get activeExtruder (): Extruder | undefined {
    return this.$typedGetters['printer/getActiveExtruder']
  }

  get extruderReady (): boolean {
    const activeExtruder = this.activeExtruder

    return (
      activeExtruder?.can_extrude ??
      (
        activeExtruder !== undefined &&
        activeExtruder.temperature >= 0 &&
        activeExtruder.min_extrude_temp >= 0 &&
        activeExtruder.temperature >= activeExtruder.min_extrude_temp
      )
    )
  }

  get extruderDisconnected (): boolean {
    return this.activeExtruder?.disconnected ?? false
  }

  get filamentDiameter (): number {
    return this.activeExtruder?.config?.filament_diameter || 1.75
  }

  get nozzleDiameter (): number {
    return this.activeExtruder?.config?.nozzle_diameter || 0.4
  }

  get maxExtrudeSpeed (): number {
    return this.activeExtruder?.config?.max_extrude_only_velocity || 500
  }

  get maxExtrudeLength (): number {
    return this.activeExtruder?.config?.max_extrude_only_distance || 50
  }

  get allHomed (): boolean {
    return this.$typedGetters['printer/getHomedAxes']('xyz')
  }

  get xyHomed (): boolean {
    return this.$typedGetters['printer/getHomedAxes']('xy')
  }

  get xHomed (): boolean {
    return this.$typedGetters['printer/getHomedAxes']('x')
  }

  get yHomed (): boolean {
    return this.$typedGetters['printer/getHomedAxes']('y')
  }

  get zHomed (): boolean {
    return this.$typedGetters['printer/getHomedAxes']('z')
  }

  get xHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings.stepper_x1 != null
  }

  get yHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings.stepper_y1 != null
  }

  get zHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings.stepper_z1 != null
  }

  get isManualProbeActive (): boolean {
    return this.$typedGetters['printer/getIsManualProbeActive']
  }

  get isBedScrewsAdjustActive (): boolean {
    return this.$typedGetters['printer/getIsBedScrewsAdjustActive']
  }

  get hasScrewsTiltAdjustResults (): boolean {
    return this.$typedGetters['printer/getHasScrewsTiltAdjustResults']
  }

  get manualProbeDialogOpen (): boolean {
    return this.$typedState.printer.manualProbeDialogOpen
  }

  set manualProbeDialogOpen (value: boolean) {
    this.$typedDispatch('printer/manualProbeDialogOpen', value)
  }

  get bedScrewsAdjustDialogOpen (): boolean {
    return this.$typedState.printer.bedScrewsAdjustDialogOpen
  }

  set bedScrewsAdjustDialogOpen (value: boolean) {
    this.$typedDispatch('printer/bedScrewsAdjustDialogOpen', value)
  }

  get screwsTiltAdjustDialogOpen (): boolean {
    return this.$typedState.printer.screwsTiltAdjustDialogOpen
  }

  set screwsTiltAdjustDialogOpen (value: boolean) {
    this.$typedDispatch('printer/screwsTiltAdjustDialogOpen', value)
  }

  get forceMoveEnabled (): boolean {
    return this.$typedState.printer.forceMoveEnabled
  }
}
