import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'
import type { Macro } from '@/store/macros/types'
import type { Device } from '@/store/power/types'

@Component
export default class StateMixin extends Vue {
  get appReady (): boolean {
    return this.$store.state.config.appReady
  }

  get authenticated (): boolean {
    return this.$store.state.auth.authenticated
  }

  get socketConnected (): boolean {
    return this.$store.getters['socket/getConnectionState']
  }

  get apiConnected (): boolean {
    return this.$store.getters['socket/getApiConnected']
  }

  get socketConnecting (): boolean {
    return this.$store.getters['socket/getConnectingState']
  }

  get klippyReady (): boolean {
    return this.$store.getters['printer/getKlippyReady']
  }

  get klippyConnected (): boolean {
    return this.$store.getters['printer/getKlippyConnected']
  }

  get hasWarnings (): boolean {
    return this.$store.getters['printer/getHasWarnings']
  }

  get klippyState (): string {
    return this.$store.getters['printer/getKlippyState']
  }

  get klippyStateMessage (): string {
    return this.$store.getters['printer/getKlippyStateMessage']
  }

  // Return the printer state
  get printerState (): 'printing' | 'paused' | 'cancelled' | 'ready' | 'busy' | 'idle' | 'loading' {
    return this.$store.getters['printer/getPrinterState']
  }

  // Returns a boolean indicating if the printer is busy.
  get printerBusy () {
    const printerState = this.printerState

    return (
      printerState === 'printing' ||
      printerState === 'paused' ||
      printerState === 'busy'
    )
  }

  // Returns a boolean indicating if the printer is paused.
  get printerPaused (): boolean {
    return this.printerState === 'paused'
  }

  /**
   * Returns a boolean indicating of the printer is printing.
   * (versus busy in some other way...)
   */
  get printerPrinting (): boolean {
    return this.printerState === 'printing'
  }

  get printerPoweredOff (): boolean {
    if (this.klippyConnected) {
      return false
    }

    const printerPowerDevice: string = this.$store.state.config.uiSettings.general.printerPowerDevice ?? 'printer'

    const device: Device | undefined = this.$store.getters['power/getDeviceByName'](printerPowerDevice)

    return device?.status === 'off'
  }

  /**
   * Indicates if we have a valid wait(s).
   * Supports a single string or a list of.
   */
  hasWait (wait: string | string[]): boolean {
    return this.$store.getters['wait/hasWait'](wait)
  }

  /**
   * Indicates if we have any waits.
   */
  get hasWaits (): boolean {
    return this.$store.getters['wait/hasWaits']
  }

  /**
   * Indicates if we have any waits prefixed by.
   */
  hasWaitsBy (prefix: string): boolean {
    return this.$store.getters['wait/hasWaitsBy'](prefix)
  }

  /**
   * Send a gcode script.
   */
  sendGcode (gcode: string, wait?: string) {
    SocketActions.printerGcodeScript(gcode, wait)
    this.addConsoleEntry(gcode)
  }

  sendMoveGcode (movement: { X?: number, Y?: number, Z?: number }, rate: number, absolute = false, wait?: string) {
    const macro: Macro | undefined = this.$store.getters['macros/getMacroByName']('_CLIENT_LINEAR_MOVE')

    const paramSeparator = macro
      ? '='
      : ''
    const movementGcode = Object.entries(movement)
      .map(([key, value]) => `${key}${paramSeparator}${value}`)
      .join(' ')

    const gcode = macro
      ? `${macro.name.toUpperCase()} ${movementGcode} F=${rate * 60}${absolute ? ' ABSOLUTE=1' : ''}`
      : `SAVE_GCODE_STATE NAME=_ui_movement
G9${absolute ? 0 : 1}
G1 ${movementGcode} F${rate * 60}
RESTORE_GCODE_STATE NAME=_ui_movement`

    this.sendGcode(gcode, wait)
  }

  sendExtrudeGcode (amount: number, rate: number, wait?: string) {
    const macro: Macro | undefined = this.$store.getters['macros/getMacroByName']('_CLIENT_LINEAR_MOVE')

    const gcode = macro
      ? `${macro.name.toUpperCase()} E=${amount} F=${rate * 60}`
      : `SAVE_GCODE_STATE NAME=_ui_retract
M83
G1 E${amount} F${rate * 60}
RESTORE_GCODE_STATE NAME=_ui_retract`

    this.sendGcode(gcode, wait)
  }

  addConsoleEntry (message: string) {
    this.$store.dispatch('console/onAddConsoleEntry', { message, type: 'command' })
  }

  async emergencyStop () {
    const confirmOnEstop: boolean = this.$store.state.config.uiSettings.general.confirmOnEstop

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

  async cancelPrint () {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_cancel_print'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.printerPrintCancel()
      this.addConsoleEntry('CANCEL_PRINT')
    }
  }

  pausePrint () {
    SocketActions.printerPrintPause()
    this.addConsoleEntry('PAUSE')
  }

  resumePrint () {
    SocketActions.printerPrintResume()
    this.addConsoleEntry('RESUME')
  }

  homeAll () {
    this.sendGcode('G28', this.$waits.onHomeAll)
  }
}
