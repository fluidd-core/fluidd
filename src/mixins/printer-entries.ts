import { Component, Mixins } from 'vue-property-decorator'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from './state'
import { cloudState } from '@/services/muon-cloud/state'
import {
  activateCloudPrinter,
  activateLocalPrinter,
  activationState,
  MANAGED_API_URL
} from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  instanceFor,
  instanceForHost,
  lanAddresses,
  refreshKnownPrinters
} from '@/services/muon-cloud/discovery'
import {
  hostOf,
  printerDirectory,
  type CardAction,
  type Directory,
  type DirectoryEntry,
  type LocalLive,
  type PrinterHealth
} from '@/services/muon-cloud/directory'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { lookNearby, nearbyState, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { useBluetoothFor } from '@/services/muon-ble/link'
import { lanPrinterAccess, type AccessAsk, type AccessClient } from '@/services/muon-access/api'

/**
 * Every printer this browser knows of, and what can be done with each:
 * open it here or through Muon3D, link it, ask for access, set it up,
 * forget it. The header's switcher and the Printers page both list
 * printers this way, so a printer behaves the same in either. Each keeps
 * the dialogs these open in its own template.
 */
@Component
export default class PrinterEntriesMixin extends Mixins(StateMixin) {
  instanceDialogOpen = false
  accountDialog = false
  linkDialog = false
  linkPrinterId = ''
  linkHost = ''
  /** A printer picked for linking before sign-in. */
  pendingLink: DirectoryEntry | null = null
  busyKey: string | null = null
  notice: string | null = null
  setupDialog = false
  setupPrinter: NearbyPrinter | null = null
  /** "Ask for access" to a printer on this network (ACC-17). */
  accessDialog = false
  accessClient: AccessClient | null = null
  accessAsk: AccessAsk | null = null
  accessName = ''

  get account () {
    return cloudState.account
  }

  get nearby () {
    return nearbyState
  }

  get bluetoothSearch () {
    return nearbyState.support === 'supported'
  }

  get bluetoothOff () {
    return this.bluetoothSearch && nearbyState.radio === 'off'
  }

  get activationError () {
    return activationState.error
  }

  get activationFallback () {
    return activationState.fallbackUrl
  }

  get searching () {
    return discoveryState.scanning
  }

  get blockedByPage () {
    return discoveryState.blockedByPage
  }

  get scanNetwork () {
    return discoveryState.network
  }

  get savedInstances (): InstanceConfig[] {
    const all: InstanceConfig[] = this.$store.getters['config/getInstances'] ?? []
    return all.filter(i => i.apiUrl !== MANAGED_API_URL)
  }

  /** The printer Fluidd is on locally, from its own socket. */
  get localLive (): LocalLive | null {
    if (cloudState.activePrinterId) return null
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl || apiUrl === MANAGED_API_URL) return null
    let health: PrinterHealth
    if (!this.socketConnected) health = 'connecting'
    else if (!this.authenticated) health = 'locked'
    else if (!this.klippyReady) health = 'error'
    else if (this.printerPrinting) health = 'printing'
    else if (this.printerPaused) health = 'paused'
    else health = 'online'
    return { apiUrl, health, detail: this.localDetail(health) }
  }

  localDetail (health: PrinterHealth): string {
    if (health === 'connecting') return 'Connecting…'
    if (health === 'locked') return 'Waiting for sign-in'
    const state = this.$filters.prettyCase(this.printerState || 'unknown')
    if (this.printerPrinting || this.printerPaused) {
      const progress = Math.floor((this.$store.getters['printer/getPrintProgress'] ?? 0) * 100)
      return `${state} · ${progress}%`
    }
    return state
  }

  get directory (): Directory {
    return printerDirectory({
      account: this.account ? cloudState.printers : [],
      status: cloudState.status,
      email: this.account?.email ?? null,
      saved: this.savedInstances,
      found: discoveryState.found,
      cloudNearby: discoveryState.cloud,
      nearby: nearbyState.printers,
      activeCloudId: cloudState.activePrinterId,
      local: this.localLive,
      searching: discoveryState.scanning || !discoveryState.finishedAt
    })
  }

  rescan () {
    this.notice = null
    discoveryState.cloudChecked = false
    discoverPrinters(true).catch(() => {})
  }

  async onLookNearby () {
    this.notice = null
    await lookNearby()
  }

  // -- what each printer offers ----------------------------------------------

  cloudActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    if (e.active !== 'local') {
      actions.push({
        id: 'connect-local',
        label: 'Connect locally',
        icon: '$lan',
        hint: e.host ? e.host : 'Not found on this network',
        disabled: !e.host
      })
    }
    if (e.active !== 'cloud') {
      actions.push({ id: 'connect-cloud', label: 'Connect through Muon3D', icon: '$cloud', disabled: !e.cloud?.online })
    }
    if (e.nearby && !e.cloud?.online) {
      actions.push({ id: 'connect-bluetooth', label: 'Connect over Bluetooth', icon: '$bluetooth' })
    }
    actions.push({
      id: 'access',
      label: 'Access and protection',
      icon: '$printerAccess',
      hint: e.active ? undefined : 'Opens the printer first'
    })
    return actions
  }

  /** Someone else's printer, or one that refused this browser: ask its panel to let this browser in. */
  askAction (e: DirectoryEntry): CardAction | null {
    if (e.linkedTo !== 'other' && e.health !== 'locked') return null
    return {
      id: 'ask',
      label: 'Ask for access',
      icon: '$printerAsk',
      hint: e.linkedTo === 'other' ? 'Linked to another account' : 'It wants access',
      disabled: !e.host
    }
  }

  localActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    const ask = this.askAction(e)
    if (ask) {
      actions.push(ask)
    } else if (e.linkedTo !== 'mine') {
      actions.push({ id: 'link', label: 'Link to my account', icon: '$linkPrinter', disabled: !e.host, hint: e.host ? undefined : 'Not found on this network' })
    }
    if (e.active) {
      actions.push({ id: 'access', label: 'Access and protection', icon: '$printerAccess' })
    }
    actions.push({
      id: 'remove',
      label: 'Remove',
      icon: '$printerRemove',
      danger: true,
      disabled: !!e.active,
      hint: e.active ? 'Connect to another printer first' : undefined
    })
    return actions
  }

  foundActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    if (e.row?.action === 'open') actions.push({ id: 'connect', label: 'Connect', icon: '$lan', disabled: !e.host })
    if (e.row?.canLink) actions.push({ id: 'link', label: 'Link to my account', icon: '$linkPrinter' })
    const ask = this.askAction(e)
    if (ask) actions.push(ask)
    return actions
  }

  actionsFor (e: DirectoryEntry): CardAction[] {
    if (e.section === 'cloud') return this.cloudActions(e)
    if (e.section === 'local') return this.localActions(e)
    return this.foundActions(e)
  }

  onAction (e: DirectoryEntry, id: string) {
    this.notice = null
    switch (id) {
      case 'connect-local': return this.connectLocal(e)
      case 'connect-cloud': return this.connectCloud(e)
      case 'connect-bluetooth':
        if (!e.cloud || !e.nearby) return
        useBluetoothFor(e.cloud.id, e.nearby.device)
        return this.connectCloud(e)
      case 'connect': return this.openFoundEntry(e)
      case 'link': return this.link(e)
      case 'remove': return this.remove(e)
      case 'access': return this.openAccess(e)
      case 'ask': return this.askForAccess(e)
    }
  }

  // -- opening ---------------------------------------------------------------

  /** After a printer opened from here. The switcher closes; the Printers page goes to the printer. */
  afterOpen () {
    this.$emit('click')
  }

  async run (key: string, work: () => Promise<boolean>) {
    if (this.busyKey) return
    this.busyKey = key
    try {
      if (await work()) this.afterOpen()
    } catch { /* activationState holds the reason */ } finally {
      this.busyKey = null
    }
  }

  /** Opens any printer the way its group does: the account's, a saved one, or one found here. */
  openEntry (e: DirectoryEntry) {
    if (e.section === 'cloud') return this.openCloudEntry(e)
    if (e.section === 'local') return this.openLocalEntry(e)
    return this.openFoundEntry(e)
  }

  openCloudEntry (e: DirectoryEntry) {
    if (e.active) {
      this.afterOpen()
      return
    }
    // The service lost it, and it answers here: the local way in is the one that works.
    if (!e.cloud?.online && e.host) return this.connectLocal(e)
    return this.connectCloud(e)
  }

  connectCloud (e: DirectoryEntry) {
    if (!e.cloud) return
    const id = e.cloud.id
    return this.run(e.key, async () => {
      await activateCloudPrinter(id)
      return true
    })
  }

  /** The saved address it answers on, else its address on this network. */
  localInstance (e: DirectoryEntry): InstanceConfig | null {
    if (e.lan) {
      const answering = lanAddresses(e.lan)
      const saved = e.saved.find(s => answering.includes(hostOf(s.apiUrl)))
      return saved ?? instanceFor(e.lan)
    }
    if (e.host) return instanceForHost(e.host, e.name, e.endpointId)
    return e.saved[0] ?? null
  }

  connectLocal (e: DirectoryEntry) {
    const instance = this.localInstance(e)
    if (!instance) return
    return this.run(e.key, () => activateLocalPrinter(instance))
  }

  openLocalEntry (e: DirectoryEntry) {
    if (e.active) {
      this.afterOpen()
      return
    }
    return this.connectLocal(e)
  }

  openFoundEntry (e: DirectoryEntry) {
    const row = e.row
    if (!row) return
    switch (row.action) {
      case 'open':
        return this.connectLocal(e)
      case 'set-up':
        if (!row.nearby) return
        this.setupPrinter = row.nearby
        this.setupDialog = true
        return
      case 'nearby-info':
        this.notice = `${row.name} is nearby. This browser hears it over Bluetooth, but it isn't on this ` +
          "network or your account. Join the network it's on, or link it to your account at the printer."
    }
  }

  async openInstance (instance: InstanceConfig) {
    await this.run(`address:${instance.apiUrl}`, () => activateLocalPrinter(instance))
  }

  // -- managing --------------------------------------------------------------

  link (e: DirectoryEntry) {
    if (!this.account) {
      this.pendingLink = e
      this.accountDialog = true
      return
    }
    const nearbyId = e.row?.cloudId ??
      discoveryState.cloud.find(c => c.printerId === e.endpointId)?.printerId ?? ''
    this.linkPrinterId = nearbyId
    this.linkHost = nearbyId ? '' : (e.host ?? '')
    this.linkDialog = true
  }

  onSignedIn () {
    const pending = this.pendingLink
    this.pendingLink = null
    if (pending) this.link(pending)
  }

  remove (e: DirectoryEntry) {
    for (const s of e.saved) this.$store.dispatch('config/removeInstance', s)
  }

  askForAccess (e: DirectoryEntry) {
    if (!e.host) return
    this.accessClient = lanPrinterAccess(`http://${e.host}`)
    this.accessAsk = { kind: 'join' }
    this.accessName = e.name
    this.accessDialog = true
  }

  onAccessAnswered () {
    refreshKnownPrinters().catch(() => {})
  }

  async openAccess (e: DirectoryEntry) {
    if (!e.active) {
      if (e.section === 'cloud') await this.connectCloud(e)
      else await this.connectLocal(e)
      if (activationState.error) return
    }
    this.$emit('click')
    const hash = this.$store.getters['server/componentSupport']('muon_access') ? '#access' : '#protection'
    const settings = scopedPath('/settings', activeSlug())
    if (this.$route.path !== settings || this.$route.hash !== hash) {
      this.$router.push({ path: settings, hash }).catch(() => {})
    }
  }
}
