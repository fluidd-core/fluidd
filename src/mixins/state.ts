import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'
import { Waits } from '@/globals'

@Component
export default class StateMixin extends Vue {
  waits = Waits

  get authenticated () {
    const auth = this.$store.getters['auth/getAuthenticated']
    return auth
  }

  get socketConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get apiConnected () {
    return this.$store.getters['socket/getApiConnected']
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
    return this.$store.getters['printer/getPrinterState']
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
    if (this.printerState === 'printing') return true
    return false
  }

  /**
   * Indicates if we have a valid wait(s).
   * Supports a single string or a list of.
   */
  hasWait (wait: string | string[]) {
    return this.$store.getters['wait/hasWait'](wait)
  }

  /**
   * Indicates if we have any waits.
   */
  get hasWaits () {
    return this.$store.getters['wait/hasWaits']
  }

  /**
   * Indicates if we have any waits prefixed by.
   */
  hasWaitsBy (prefix: string) {
    return this.$store.getters['wait/hasWaitsBy'](prefix)
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

  async emergencyStop () {
    const confirmOnEstop = this.$store.state.config.uiSettings.general.confirmOnEstop
    let res: boolean | undefined = true
    if (confirmOnEstop) {
      res = await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    }
    if (res) {
      SocketActions.printerEmergencyStop()
    }
  }
}
