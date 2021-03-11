import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component
export default class ToolheadMixin extends Vue {
  /**
   * Ensures our temps are high enough to extrude or retract.
   */
  get minExtrudeTemp () {
    const minExtrudeTemp = this.$store.getters['printer/getPrinterSettings']('extruder.min_extrude_temp')
    return (minExtrudeTemp !== undefined)
      ? this.$store.getters['printer/getPrinterSettings']('extruder.min_extrude_temp')
      : 0
  }

  get extrudeRetractReady () {
    const extruder = this.$store.state.printer.printer.extruder || undefined
    return (extruder && extruder.temperature >= 0 && this.minExtrudeTemp >= 0)
      ? (extruder.temperature >= this.minExtrudeTemp)
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
}
