import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import { SocketActions } from '@/api/socketActions'
import { inspectTypedGcode } from '@/services/console/typed-gcode'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

/** Typed entry points share this preflight/send path; panel-generated G-code stays in StateMixin. */
@Component
export default class TypedCommandsMixin extends Mixins(StateMixin) {
  commandRefusal = ''

  get commandTarget (): string {
    return JSON.stringify([
      this.$store.state.config.apiUrl,
      cloudState.activePrinterId,
      cloudState.account?.id ?? null
    ])
  }

  get commandControlAvailable (): boolean {
    if (!this.socketConnected || !this.apiConnected || !this.authenticated) return false
    const remote = isManagedApiUrl(this.$store.state.config.apiUrl)
    if (remote !== printerTransportBinding.remote) return false
    if (!remote) return true // Existing LAN authentication; Moonraker remains the authority.
    return cloudState.printers.find(p => p.id === cloudState.activePrinterId)?.role === 'operator'
  }

  get restartRefusal (): string {
    if (!this.commandControlAvailable) return 'Not sent. Connect to a printer you can control first.'
    if (this.printerBusy) return 'Not sent. Wait until the printer has finished and is no longer paused or busy.'
    // A known Klipper error/shutdown can be recovered even before print status loads.
    if (this.printerState === 'loading' && !['error', 'shutdown'].includes(this.klippyState.toLowerCase())) return 'Not sent. Wait for the printer status before restarting.'
    return ''
  }

  async confirmCommandRestart (): Promise<boolean> {
    this.commandRefusal = this.restartRefusal
    if (this.commandRefusal) return false
    const target = this.commandTarget
    const ok = await this.$confirm('Klipper reloads its settings. The printer must be idle before it can restart.', {
      title: 'Restart Klipper?', buttonTrueText: 'Restart', buttonFalseText: 'Keep running', danger: true
    })
    if (!ok) return false
    this.commandRefusal = target !== this.commandTarget ? 'Not sent. The selected printer or account changed. Try again.' : this.restartRefusal
    return !this.commandRefusal
  }

  async sendTypedGcode (gcode: string): Promise<boolean> {
    this.commandRefusal = ''
    if (!gcode.trim()) return false
    if (!this.commandControlAvailable) {
      this.commandRefusal = 'Not sent. Connect to a printer you can control first.'
      return false
    }
    const batch = inspectTypedGcode(gcode, this.$store.state.printer.printer.configfile)
    this.commandRefusal = batch.refusal ?? ''
    if (this.commandRefusal) return false
    if (batch.savesConfig && (!this.klippyConnected || !this.klippyReady)) {
      this.commandRefusal = 'Not sent. Klipper must be running to save settings.'
      return false
    }
    if (!this.klippyConnected && !(batch.restarts && batch.onlyRestarts)) {
      this.commandRefusal = 'Not sent. Klipper is not connected.'
      return false
    }
    if (batch.restarts && !await this.confirmCommandRestart()) return false
    if (batch.savesConfig && (!this.klippyConnected || !this.klippyReady)) {
      this.commandRefusal = 'Not sent. Klipper must be running to save settings.'
      return false
    }
    if (!this.klippyConnected && !batch.onlyRestarts) {
      this.commandRefusal = 'Not sent. Klipper is not connected.'
      return false
    }
    // Re-read config after a confirmation as well as connection, identity and busy state.
    this.commandRefusal = inspectTypedGcode(gcode, this.$store.state.printer.printer.configfile).refusal ?? ''
    if (this.commandRefusal) return false
    if (gcode.toLowerCase() === 'm112') SocketActions.printerEmergencyStop()
    this.sendGcode(gcode)
    return true
  }
}
