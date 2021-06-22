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
}
