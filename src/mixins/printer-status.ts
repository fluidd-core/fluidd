import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import { pageOfRoute } from '@/router/printerPagePaths'

export type PrinterStatusTone = 'ok' | 'active' | 'warn' | 'fault' | 'off'

// Page names for the glass style's toolbar and large titles. A route that is
// not listed falls back to its route name.
const pageTitleKeys: Record<string, string> = {
  '/jobs': 'app.general.title.jobs',
  '/preview': 'app.general.title.gcode_preview',
  '/console': 'app.general.title.console',
  '/history': 'app.general.title.history',
  '/timelapse': 'app.general.title.timelapse',
  '/tune': 'app.general.title.tune',
  '/configure': 'app.general.title.configure',
  '/diagnostics': 'app.general.title.diagnostics',
  '/wifi': 'app.general.title.wifi',
  '/system': 'app.general.title.system',
  '/settings': 'app.general.title.settings'
}

@Component
export default class PrinterStatusMixin extends Mixins(StateMixin) {
  get displayName (): string {
    return this.$store.getters['config/getDisplayName'] as string
  }

  get printProgress (): number {
    return Math.floor((this.$store.getters['printer/getPrintProgress'] as number) * 100)
  }

  get statusTone (): PrinterStatusTone {
    if (!this.socketConnected) return 'off'
    if (!this.klippyReady) {
      return ['error', 'shutdown'].includes(this.klippyState) ? 'fault' : 'warn'
    }

    switch (this.printerState.toLowerCase()) {
      case 'printing':
      case 'busy':
        return 'active'
      case 'paused':
        return 'warn'
      case 'error':
      case 'cancelled':
        return 'fault'
      default:
        return 'ok'
    }
  }

  get statusText (): string {
    if (!this.socketConnected) return 'Offline'
    if (!this.klippyReady) return `Klipper ${this.klippyState || 'offline'}`

    const state = this.$filters.prettyCase(this.printerState)

    return this.printerPrinting ? `${state} · ${this.printProgress}%` : state
  }

  // Home is named by the printer; every other page by its own name.
  get pageTitle (): string {
    const section = `/${pageOfRoute(this.$route).split('/')[1]}`

    if (this.$route.name === 'Dashboard') return this.displayName

    const key = pageTitleKeys[section]

    return key ? this.$t(key).toString() : (this.$route.name ?? '')
  }

  get pageSubtitle (): string {
    return this.$route.name === 'Dashboard'
      ? this.statusText
      : `${this.displayName} · ${this.statusText}`
  }
}
