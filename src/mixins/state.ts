import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'
import type { ServerInfo } from '@/store/server/types'

@Component
export default class StateMixin extends Vue {
  get authenticated (): boolean {
    return this.$store.getters['auth/getAuthenticated'] as boolean
  }

  get socketConnected (): boolean {
    return this.$store.getters['socket/getConnectionState'] as boolean
  }

  get apiConnected (): boolean {
    return this.$store.getters['socket/getApiConnected'] as boolean
  }

  get socketConnecting (): boolean {
    return this.$store.getters['socket/getConnectingState'] as boolean
  }

  get klippyReady (): boolean {
    return this.$store.getters['printer/getklippyReady'] as boolean
  }

  get klippyConnected (): boolean {
    const server = this.$store.getters['server/getInfo'] as ServerInfo

    return server.klippy_connected
  }

  get hasWarnings (): boolean {
    return this.$store.getters['printer/getHasWarnings'] as boolean
  }

  get klippyState (): string {
    return this.$store.getters['printer/getKlippyState'] as string
  }

  get klippyStateMessage (): string {
    return this.$store.getters['printer/getKlippyStateMessage'] as string
  }

  // Return the printer state
  get printerState (): string {
    return this.$store.getters['printer/getPrinterState'] as string
  }

  // Returns a boolean indicating if the printer is busy.
  get printerBusy () {
    const printerState = this.printerState.toLowerCase()

    return (
      printerState === 'printing' ||
      printerState === 'paused' ||
      printerState === 'busy'
    )
  }

  // Returns a boolean indicating if the printer is paused.
  get printerPaused (): boolean {
    return this.printerState.toLowerCase() === 'paused'
  }

  /**
   * Returns a boolean indicating of the printer is printing.
   * (versus busy in some other way...)
   */
  get printerPrinting (): boolean {
    return this.printerState.toLowerCase() === 'printing'
  }

  /**
   * Indicates if we have a valid wait(s).
   * Supports a single string or a list of.
   */
  hasWait (wait: string | string[]): boolean {
    return this.$store.getters['wait/hasWait'](wait) as boolean
  }

  /**
   * Indicates if we have any waits.
   */
  get hasWaits (): boolean {
    return this.$store.getters['wait/hasWaits'] as boolean
  }

  /**
   * Indicates if we have any waits prefixed by.
   */
  hasWaitsBy (prefix: string): boolean {
    return this.$store.getters['wait/hasWaitsBy'](prefix) as boolean
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

    const result = (
      !confirmOnEstop ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_emergency_stop'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      SocketActions.printerEmergencyStop()
    }
  }
}
