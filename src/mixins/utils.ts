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
   * Ensures our temps are high enough to extrude or retract.
   */
  get minExtrudeTemp () {
    return (this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp !== undefined)
      ? parseInt(this.$store.state.socket.printer.configfile.config.extruder.min_extrude_temp)
      : 170 // Default to a sane value
  }

  get extrudeRetractReady () {
    const extruder = this.$store.state.socket.printer.extruder || undefined
    return (extruder && extruder.temperature >= 0 && this.minExtrudeTemp >= 0)
      ? (extruder.temperature >= this.minExtrudeTemp)
      : false
  }

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    SocketActions.printerGcodeScript(gcode, wait)
    this.addConsoleEntry(gcode)
  }

  addConsoleEntry (message: string) {
    this.$store.dispatch('socket/addConsoleEntry', { message, type: 'command' })
  }

  /**
   * Send a move gcode script.
   */
  sendMoveGcode (axis: string, distance: string, negative = false) {
    axis = axis.toLowerCase()
    const rate = (axis.toLowerCase() === 'z')
      ? this.$store.state.config.fileConfig.general.defaultToolheadZSpeed
      : this.$store.state.config.fileConfig.general.defaultToolheadXYSpeed
    const inverted = this.$store.state.config.fileConfig.general.axis[axis].inverted || false
    distance = ((negative && !inverted) || (!negative && inverted))
      ? '-' + distance
      : distance

    this.sendGcode(`G91
      G1 ${axis}${distance} F${rate * 60}
      G90`)
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: '+' | '-', distance: string, wait?: string) {
    const gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${distance} MOVE=1`
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
