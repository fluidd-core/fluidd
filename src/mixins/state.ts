import Vue from 'vue'
import { SocketActions } from '@/socketActions'
import { Component, Watch } from 'vue-property-decorator'
import { Globals, Waits } from '@/globals'

@Component
export default class UtilsMixin extends Vue {
  waits = Waits

  get socketConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get socketConnecting () {
    return this.$store.getters['socket/getConnectingState']
  }

  get klippyReady () {
    return this.$store.getters['printer/getklippyReady']
  }

  get klippyConnected () {
    const server = this.$store.getters['server/getInfo']
    return server.klippy_connected
  }

  @Watch('klippyReady')
  onklippyReadyChange (val: boolean, oldVal: boolean) {
    if (oldVal && !val) {
      // Klippy has disconnected, ensure the user doesn't stick around on the jobs page if already.
      if (this.$router.currentRoute.path === '/jobs') {
        this.$router.push({ path: Globals.KLIPPY_DISCONNECTED_REDIRECT })
      }
    }
  }

  get hasWarnings () {
    return this.$store.getters['printer/getHasWarnings']
  }

  get klippyState () {
    return this.$store.getters['printer/getKlippyState']
  }

  get klippyStateMessage () {
    return this.$store.getters['printer/getKlippyStateMessage']
  }

  // Return the printer state
  get printerState () {
    return this.$filters.startCase(this.$store.getters['printer/getPrinterState'])
  }

  // Returns a boolean indicating if the printer is busy.
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

  // Returns a boolean indicating if the printer is paused.
  get printerPaused () {
    const printerState = this.printerState.toLowerCase()
    if (
      printerState === 'paused'
    ) {
      return true
    }
    return false
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

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    SocketActions.printerGcodeScript(gcode, wait)
    this.addConsoleEntry(gcode)
  }

  addConsoleEntry (message: string) {
    this.$store.dispatch('console/onAddConsoleEntry', { message, type: 'command' })
  }
}
