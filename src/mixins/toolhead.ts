import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component
export default class ToolheadMixin extends Vue {
  get activeExtruder () {
    return this.$store.getters['printer/getActiveExtruder']
  }

  get extruderReady () {
    const extruder = this.$store.getters['printer/getActiveExtruder']
    return (extruder && extruder.temperature >= 0 && extruder.min_extrude_temp >= 0)
      ? (extruder.temperature >= extruder.min_extrude_temp)
      : false
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
    return !!this.$store.getters['printer/getPrinterConfig']('stepper_x1')
  }

  get yHasMultipleSteppers (): boolean {
    return !!this.$store.getters['printer/getPrinterConfig']('stepper_y1')
  }

  get zHasMultipleSteppers (): boolean {
    return !!this.$store.getters['printer/getPrinterConfig']('stepper_z1')
  }

  get hasHomingOverride (): boolean {
    return this.$store.getters['printer/getHasHomingOverride']
  }

  get isManualProbeActive () {
    return this.$store.getters['printer/getIsManualProbeActive']
  }

  get isBedScrewsAdjustActive () {
    return this.$store.getters['printer/getIsBedScrewsAdjustActive']
  }
}
