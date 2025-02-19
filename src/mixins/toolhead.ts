import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import type { Extruder, KlipperPrinterSettings } from '@/store/printer/types'

@Component
export default class ToolheadMixin extends Vue {
  get hasExtruder (): boolean {
    return this.$store.getters['printer/getHasExtruder']
  }

  get hasMultipleExtruders (): boolean {
    return this.$store.getters['printer/getHasMultipleExtruders']
  }

  get activeExtruder (): Extruder | undefined {
    return this.$store.getters['printer/getActiveExtruder']
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
    return this.$store.getters['printer/getHomedAxes']('xyz')
  }

  get xyHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('xy')
  }

  get xHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('x')
  }

  get yHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('y')
  }

  get zHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('z')
  }

  get xHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$store.getters['printer/getPrinterSettings']

    return printerSettings.stepper_x1 != null
  }

  get yHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$store.getters['printer/getPrinterSettings']

    return printerSettings.stepper_y1 != null
  }

  get zHasMultipleSteppers (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$store.getters['printer/getPrinterSettings']

    return printerSettings.stepper_z1 != null
  }

  get isManualProbeActive (): boolean {
    return this.$store.getters['printer/getIsManualProbeActive']
  }

  get isBedScrewsAdjustActive (): boolean {
    return this.$store.getters['printer/getIsBedScrewsAdjustActive']
  }

  get hasScrewsTiltAdjustResults (): boolean {
    return this.$store.getters['printer/getHasScrewsTiltAdjustResults']
  }

  get manualProbeDialogOpen (): boolean {
    return this.$store.state.printer.manualProbeDialogOpen
  }

  set manualProbeDialogOpen (value: boolean) {
    this.$store.dispatch('printer/manualProbeDialogOpen', value)
  }

  get bedScrewsAdjustDialogOpen (): boolean {
    return this.$store.state.printer.bedScrewsAdjustDialogOpen
  }

  set bedScrewsAdjustDialogOpen (value: boolean) {
    this.$store.dispatch('printer/bedScrewsAdjustDialogOpen', value)
  }

  get screwsTiltAdjustDialogOpen (): boolean {
    return this.$store.state.printer.screwsTiltAdjustDialogOpen
  }

  set screwsTiltAdjustDialogOpen (value: boolean) {
    this.$store.dispatch('printer/screwsTiltAdjustDialogOpen', value)
  }

  get forceMoveEnabled (): boolean {
    return this.$store.state.printer.forceMoveEnabled
  }
}
