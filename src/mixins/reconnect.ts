import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import { appInit } from '@/init'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'

/**
 * Trying the printer again, for the connection's bar and screen: now, when
 * the socket client is waiting out its backoff, or from the start when it
 * has stopped. A cloud printer has no address of its own; its socket comes
 * over Iroh, so it is opened again through the account.
 */
@Component({})
export default class ReconnectMixin extends Mixins(StateMixin) {
  /** Ticks each second, so a countdown moves. */
  now = Date.now()
  tick: number | null = null

  mounted () {
    this.tick = window.setInterval(() => { this.now = Date.now() }, 1000)
  }

  beforeDestroy () {
    if (this.tick !== null) window.clearInterval(this.tick)
  }

  get activeInstance () {
    return this.$store.getters['config/getCurrentInstance'] as { apiUrl: string, name?: string } | null
  }

  get viaCloud (): boolean {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.activeInstance?.apiUrl ?? '')
  }

  /** The printer's name as people say it: Boxwood. */
  get printerName (): string {
    const shown = this.$store.getters['config/getDisplayName'] as string | undefined
    const slug = activeSlug()
    return printerNameParts(slug ?? shown ?? 'the printer').name
  }

  /** Where it is being reached: its address on this network, or the account. */
  get address (): string {
    if (this.viaCloud) return 'Through Muon3D'
    try {
      return new URL(this.activeInstance?.apiUrl ?? '').host
    } catch {
      return ''
    }
  }

  /** Whether the socket client is waiting out its backoff before the next try. */
  get retryPending (): boolean {
    // Read the store (and the clock) so this recomputes as they change.
    return this.$store.state.socket.connecting && this.now > 0 && !!this.$socket?.retryPending
  }

  /** Milliseconds until the next try, or null when none is waiting. */
  get retryInMs (): number | null {
    const at = this.retryPending ? this.$socket?.nextRetryAt : null
    return at ? Math.max(0, at - this.now) : null
  }

  tryNow () {
    if (this.$socket?.retryPending) this.$socket.retryNow()
    else this.reconnect()
  }

  async reconnect () {
    const printerId = cloudState.activePrinterId
    if (printerId && this.viaCloud) {
      await activateCloudPrinter(printerId).catch(() => {})
      return
    }
    const config = await appInit(this.activeInstance as never, this.$store.state.config.hostConfig)
    if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
      this.$socket.connect(config.apiConfig.socketUrl)
    }
  }
}
