import { SocketActions } from '@/socketActions'
import Vue from 'vue'
import Component from 'vue-class-component'
import { Globals, Icons } from '@/globals'

@Component({})
export default class UtilsMixin extends Vue {
  get icons () {
    return Icons
  }

  // Indicates connection to the socket.
  get socketConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get klippyConnected () {
    return this.$store.getters['socket/getKlippyState']
  }

  // Return the printer state
  get printerState () {
    return this.$filters.startCase(this.$store.getters['socket/getPrinterState'])
  }

  // Returns a boolean indicating if the printer is busy in some way..
  get printerBusy () {
    const printerState = this.printerState.toLowerCase()
    if (
      printerState === 'printing' ||
      printerState === 'paused' ||
      printerState === 'busy'
    ) {
      return true
    }
    return false
  }

  get printerPaused () {
    const printerState = this.printerState.toLowerCase()
    if (
      printerState === 'paused'
    ) {
      return true
    }
    return false
  }

  get xyHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('xy')
  }

  get zHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('z')
  }

  /**
   * Returns a boolean indicating of the printer is printing.
   * (versus busy in some other way...)
   */
  get printerPrinting () {
    const printerState = this.printerState.toLowerCase()
    if (printerState === 'printing') return true
    return false
  }

  /**
   * Indicates if we have a valid wait.
   */
  hasWait (wait: string) {
    return this.$store.getters['socket/hasWait'](wait)
  }

  /**
   * Indicates if we have any waits.
   */
  get hasWaits () {
    return this.$store.getters['socket/hasWaits']
  }

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    if (wait) this.$store.dispatch('socket/addWait', wait)
    SocketActions.printerGcodeScript(gcode, wait)
    this.$store.dispatch('socket/addConsoleEntry', `${Globals.CONSOLE_SEND_PREFIX} ${gcode}`)
  }

  /**
   * Send a move gcode script.
   */
  sendMoveGcode (axes: string, distance: string) {
    this.sendGcode(`G91
      G1 ${axes}${distance} F6000
      G90`)
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: string, distance: string, wait?: string) {
    let gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${distance}`
    if (!this.printerPrinting) {
      gcode += ' MOVE=1'
    }
    this.sendGcode(gcode, wait)
  }

  /**
   * Retract.
   */
  sendRetractGcode (amount: number, rate: number, wait?: string) {
    const gcode = `M83
      G1 E-${amount} F${rate * 60}`
    this.sendGcode(gcode, wait)
  }

  /**
   * Extrude.
   */
  sendExtrudeGcode (amount: number, rate: number, wait?: string) {
    const gcode = `M83
      G1 E${amount} F${rate * 60}`
    this.sendGcode(gcode, wait)
  }

  get printerSupportsQgl (): boolean {
    return 'quad_gantry_level' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsZtilt (): boolean {
    return 'z_tilt' in this.$store.state.socket.printer.configfile.config
  }

  get allHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('xyz')
  }
}
