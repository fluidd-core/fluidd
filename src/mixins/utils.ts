import { SocketActions } from '@/socketActions'
import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'
import { Globals, Waits } from '@/globals'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

@Component({})
export default class UtilsMixin extends Vue {
  waits = Waits

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  get socketConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get socketConnecting () {
    return this.$store.getters['socket/getConnectingState']
  }

  get klippyConnected () {
    return this.$store.getters['socket/getKlippyConnected']
  }

  @Watch('klippyConnected')
  onKlippyConnectedChange (val: boolean, oldVal: boolean) {
    if (oldVal && !val) {
      // Klippy has disconnected, ensure the user doesn't stick around on the jobs page if already.
      if (this.$router.currentRoute.path === '/jobs') {
        this.$router.push({ path: Globals.KLIPPY_DISCONNECTED_REDIRECT })
      }
    }
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

  // Return a list of warnings we deem necessary for
  // correct usage of the web client.
  get printerWarnings () {
    const config = this.$store.state.socket.printer.configfile.config
    const warnings = []
    if (config && !config.virtual_sdcard) {
      warnings.push({ message: '[virtual_sdcard] not found in printer configuration.' })
    }

    if (config && !config.pause_resume) {
      warnings.push({ message: '[pause_resume] not found in printer configuration.' })
    }

    if (config && !config.display_status) {
      warnings.push({ message: '[display_status] not found in printer configuration.' })
    }

    if (config && ('gcode_macro CANCEL_PRINT' in config === false)) {
      warnings.push({ message: 'CANCEL_PRINT macro not found in configuration.' })
    }

    if (warnings.length > 0) {
      warnings.push({ message: 'Printer setup requirements can be found <a target="_blank" href="https://github.com/cadriel/fluidd/blob/develop/docs/printer-setup-and-macros.md">here.</a>' })
    }
    return warnings
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
    return this.$store.getters['wait/hasWait'](wait)
  }

  /**
   * Indicates if we have any waits.
   */
  get hasWaits () {
    return this.$store.getters['wait/hasWaits']
  }

  get printerSupportsQgl (): boolean {
    return 'quad_gantry_level' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsZtilt (): boolean {
    return 'z_tilt' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsBedScrews (): boolean {
    return 'bed_screws' in this.$store.state.socket.printer.configfile.config
  }

  get printerSupportsBedScrewsCalculate (): boolean {
    return 'screws_tilt_adjust' in this.$store.state.socket.printer.configfile.config
  }

  get allHomed (): boolean {
    return this.$store.getters['socket/getHomedAxes']('xyz')
  }

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    SocketActions.printerGcodeScript(gcode, wait)
    this.$store.dispatch('socket/addConsoleEntry', { message: `${Globals.CONSOLE_SEND_PREFIX} ${gcode}` })
  }

  /**
   * Send a move gcode script.
   */
  sendMoveGcode (axis: string, distance: string, negative = false) {
    axis = axis.toLowerCase()
    const inverted = this.$store.state.config.fileConfig.general.axis[axis].inverted || false
    distance = ((negative && !inverted) || (!negative && inverted))
      ? '-' + distance
      : distance

    this.sendGcode(`G91
      G1 ${axis}${distance} F6000
      G90`)
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: '+' | '-', distance: string, wait?: string) {
    const gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${distance} MOVE=1`
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

  getFile (path: string, options?: AxiosRequestConfig) {
    const o = { ...options }
    return this.$http.get(
      this.apiUrl + path + '?date=' + new Date().getTime(),
      o
    )
  }

  download (file: string, path: string) {
    const filename = file || ''
    const filepath = (path) ? `/server/files/${path}/${file}` : `/server/files/${file}`
    this.getFile(filepath, { responseType: 'blob' })
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
