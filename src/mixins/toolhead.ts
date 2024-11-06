import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import type { Extruder } from '@/store/printer/types'

@Component
export default class ToolheadMixin extends Vue {
  get hasExtruder (): boolean {
    return this.$store.getters['printer/getHasExtruder'] as boolean
  }

  get hasMultipleExtruders (): boolean {
    return this.$store.getters['printer/getHasMultipleExtruders'] as boolean
  }

  get activeExtruder (): Extruder | undefined {
    return this.$store.getters['printer/getActiveExtruder'] as Extruder | undefined
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
    return this.$store.getters['printer/getHomedAxes']('xyz') as boolean
  }

  get xyHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('xy') as boolean
  }

  get xHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('x') as boolean
  }

  get yHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('y') as boolean
  }

  get zHomed (): boolean {
    return this.$store.getters['printer/getHomedAxes']('z') as boolean
  }

  get xHasMultipleSteppers (): boolean {
    return !!this.$store.getters['printer/getPrinterSettings']('stepper_x1') as boolean
  }

  get yHasMultipleSteppers (): boolean {
    return !!this.$store.getters['printer/getPrinterSettings']('stepper_y1') as boolean
  }

  get zHasMultipleSteppers (): boolean {
    return !!this.$store.getters['printer/getPrinterSettings']('stepper_z1') as boolean
  }

  get isManualProbeActive (): boolean {
    return this.$store.getters['printer/getIsManualProbeActive'] as boolean
  }

  get isBedScrewsAdjustActive (): boolean {
    return this.$store.getters['printer/getIsBedScrewsAdjustActive'] as boolean
  }

  get hasScrewsTiltAdjustResults (): boolean {
    return this.$store.getters['printer/getHasScrewsTiltAdjustResults'] as boolean
  }
}
