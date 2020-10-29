import { SocketActions } from '@/socketActions'
import Vue from 'vue'
import Component from 'vue-class-component'
import { Globals, Waits } from '@/globals'
import { AxiosResponse } from 'axios'

@Component({})
export default class UtilsMixin extends Vue {
  waits = Waits

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  // Indicates connection to the socket.
  get socketConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get socketConnecting () {
    return this.$store.getters['socket/getConnectingState']
  }

  get klippyConnected () {
    return this.$store.getters['socket/getKlippyConnected']
  }

  get klippyState () {
    return this.$store.getters['socket/getKlippyState']
  }

  get klippyStateMessage () {
    return this.$store.getters['socket/getKlippyStateMessage']
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

  get xHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('x')
  }

  get yHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('y')
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

  get printerSupportsQgl (): boolean {
    return 'quad_gantry_level' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsZtilt (): boolean {
    return 'z_tilt' in this.$store.state.socket.printer.configfile.config
  }

  get allHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('xyz')
  }

  restartKlippy () {
    this.sendGcode('RESTART', Waits.onRestart)
    // this.$store.commit('socket/resetState')
  }

  firmwareRestartKlippy () {
    this.sendGcode('FIRMWARE_RESTART', Waits.onFirmwareRestart)
    // this.$store.commit('socket/resetState')
  }

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    if (wait) this.$store.dispatch('socket/addWait', wait)
    SocketActions.printerGcodeScript(gcode, wait)
    this.$store.dispatch('socket/addConsoleEntry', { message: `${Globals.CONSOLE_SEND_PREFIX} ${gcode}` })
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

  getFile (path: string) {
    const filepath = path
    return this.$http.get(
      this.apiUrl + filepath + '?date' + new Date().getTime(),
      {
        responseType: 'blob'
      }
    )
  }

  download (file: string, path: string) {
    const filename = file || ''
    this.getFile(`/server/files/${path}/${file}`)
      .then((response: AxiosResponse) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
      })
  }
}
