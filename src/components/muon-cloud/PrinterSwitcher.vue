<template>
  <div class="muon-switcher">
    <div class="muon-switcher__title">
      My printers
    </div>

    <div class="muon-switcher__heading">
      <v-icon
        x-small
        class="mr-1"
      >
        {{ icons.cloud }}
      </v-icon>
      Cloud
      <span
        v-if="account"
        class="muon-switcher__hint"
      >{{ account.email }}</span>
    </div>
    <template v-if="account">
      <printer-card
        v-for="e in directory.cloud"
        :key="e.key"
        :entry="e"
        :actions="cloudActions(e)"
        :busy="busyKey === e.key"
        @open="openCloudEntry(e)"
        @action="onAction(e, $event)"
      />
      <div
        v-if="!directory.cloud.length"
        class="muon-switcher__empty"
      >
        No printers are linked to this account yet. Link one from its card below.
      </div>
    </template>
    <div
      v-else
      class="muon-switcher__empty"
    >
      <a
        href="#"
        data-tid="sign-in"
        @click.prevent="accountDialog = true"
      >Sign in</a> to reach your linked printers from anywhere.
    </div>

    <div class="muon-switcher__heading">
      <v-icon
        x-small
        class="mr-1"
      >
        {{ icons.lan }}
      </v-icon>
      Local
      <span class="muon-switcher__hint">saved in this browser</span>
    </div>
    <printer-card
      v-for="e in directory.local"
      :key="e.key"
      :entry="e"
      :actions="localActions(e)"
      :busy="busyKey === e.key"
      @open="openLocalEntry(e)"
      @action="onAction(e, $event)"
    />
    <div
      v-if="!directory.local.length"
      class="muon-switcher__empty"
    >
      A printer you connect to on this network is saved here.
    </div>

    <div class="muon-switcher__title muon-switcher__title--discovery">
      Discovery
      <v-spacer />
      <span
        v-if="searching"
        class="muon-switcher__scan"
      >
        <v-progress-circular
          indeterminate
          size="11"
          width="2"
          class="mr-1"
        />
        {{ scanNetwork || 'searching' }}
      </span>
      <v-btn
        v-else
        icon
        x-small
        title="Search again"
        data-tid="search-again"
        @click="rescan"
      >
        <v-icon small>
          $refresh
        </v-icon>
      </v-btn>
    </div>
    <printer-card
      v-for="e in directory.found"
      :key="e.key"
      :entry="e"
      :actions="foundActions(e)"
      :busy="busyKey === e.key"
      @open="openFoundEntry(e)"
      @action="onAction(e, $event)"
    />
    <div
      v-if="!directory.found.length"
      class="muon-switcher__empty"
    >
      <template v-if="searching">
        Looking for Muon3D printers on this network…
      </template>
      <template v-else>
        No other printers found on this network.
      </template>
    </div>
    <v-alert
      v-if="blockedByPage"
      type="info"
      dense
      text
      class="ma-3"
      data-tid="blocked-by-page"
    >
      This browser won't let this page reach printers by their IP address, because the page was opened by
      name. Add another printer by its name instead, as shown on its screen, such as muon-walnut-8987.
      <template v-if="blockedByPage.ownUrl">
        Or <a :href="blockedByPage.ownUrl">open this printer by its IP address</a>, which can reach them all.
      </template>
    </v-alert>

    <div
      v-if="bluetoothSearch && !bluetoothOff"
      class="muon-switcher__empty"
      data-tid="look-nearby"
    >
      A printer that isn't on Wi-Fi yet?
      <a
        href="#"
        @click.prevent="onLookNearby"
      >Look nearby</a> over Bluetooth.
    </div>
    <div
      v-else-if="bluetoothOff"
      class="muon-switcher__empty"
    >
      Bluetooth is off, so new printers won't show.
    </div>

    <div class="muon-switcher__actions">
      <v-btn
        small
        text
        data-tid="enter-address"
        @click="instanceDialogOpen = true"
      >
        <v-icon
          small
          left
        >
          $plus
        </v-icon>
        Enter an address
      </v-btn>
    </div>

    <v-alert
      v-if="notice"
      type="info"
      dense
      text
      class="ma-3"
    >
      {{ notice }}
    </v-alert>
    <v-alert
      v-if="nearby.error"
      type="error"
      dense
      text
      class="ma-3"
    >
      {{ nearby.error }}
    </v-alert>
    <v-alert
      v-if="activationError"
      type="error"
      dense
      text
      class="ma-3"
    >
      {{ activationError }}
      <template v-if="activationFallback">
        <a :href="activationFallback">Open the printer's own page</a> instead.
      </template>
    </v-alert>

    <add-instance-dialog
      v-if="instanceDialogOpen"
      v-model="instanceDialogOpen"
      @resolve="openInstance"
    />
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
      @signed-in="onSignedIn"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
      :initial-printer-id="linkPrinterId"
      :initial-host="linkHost"
    />
    <access-request-dialog
      v-if="accessDialog && accessAsk && accessClient"
      v-model="accessDialog"
      :client="accessClient"
      :ask="accessAsk"
      :printer-name="accessName"
      @answered="onAccessAnswered"
    />
    <bluetooth-setup-dialog
      v-if="setupDialog && setupPrinter"
      v-model="setupDialog"
      :printer="setupPrinter"
      @finished="rescan"
    />
    <v-divider class="mt-2" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from '@/mixins/state'
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
  savedUpdates,
  type Directory,
  type DirectoryEntry,
  type LocalLive,
  type PrinterHealth
} from '@/services/muon-cloud/directory'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { lookNearby, nearbyState, startNearby, stopNearby, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { useBluetoothFor } from '@/services/muon-ble/link'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'
import PrinterCard, { type CardAction } from './PrinterCard.vue'
import BluetoothSetupDialog from '@/components/muon-ble/BluetoothSetupDialog.vue'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'
import { lanPrinterAccess, type AccessAsk, type AccessClient } from '@/services/muon-access/api'

/** How often the printers already known are asked again while the panel is open. */
const HEALTH_EVERY_MS = 15_000

/**
 * The printer list (right-hand panel): My printers, Cloud and Local, then
 * Discovery. `printerDirectory` decides which group a printer is in, so a
 * printer seen through the account, a saved address and this network lists
 * once.
 */
@Component({ components: { CloudAccountDialog, LinkPrinterDialog, PrinterCard, BluetoothSetupDialog, AccessRequestDialog } })
export default class PrinterSwitcher extends Mixins(StateMixin) {
  /** Whether the panel is open. The health checks run only while it is. */
  @Prop({ type: Boolean, default: true })
  readonly visible!: boolean

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
  icons = { cloud: '$cloud', lan: '$lan' }
  timer: number | null = null
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
      const progress = Math.round((this.$store.getters['printer/getPrintProgress'] ?? 0) * 100)
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

  // The panel is rendered inside a closed drawer on every page, so searching
  // from here on mount swept the network on every load: about 510 requests
  // over 24 s, which also stalled a reload's own first request by 3-5 s
  // (measured 2026-10-09). It searches when the panel is opened instead.
  mounted () {
    this.onVisible(this.visible)
  }

  beforeDestroy () {
    this.stopTimer()
    stopNearby()
  }

  @Watch('visible')
  onVisible (visible: boolean) {
    this.stopTimer()
    if (!visible) return
    discoverPrinters().catch(() => {})
    startNearby().catch(() => {})
    if (discoveryState.finishedAt) refreshKnownPrinters().catch(() => {})
    this.timer = window.setInterval(() => { refreshKnownPrinters().catch(() => {}) }, HEALTH_EVERY_MS)
  }

  stopTimer () {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  /** A saved printer said who it is, or moved: keep the saved entry up to date. */
  @Watch('savedFound', { immediate: true })
  onFound () {
    for (const update of savedUpdates(this.savedInstances, discoveryState.found, !!discoveryState.blockedByPage)) {
      this.$store.dispatch('config/relocateInstance', update)
    }
  }

  get savedFound () {
    return discoveryState.found.map(l => `${l.endpointId}@${lanAddresses(l).join(',')}`).join(';')
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

  // -- what each card offers ------------------------------------------------

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

  // -- opening --------------------------------------------------------------

  async run (key: string, work: () => Promise<boolean>) {
    if (this.busyKey) return
    this.busyKey = key
    try {
      if (await work()) this.$emit('click')
    } catch { /* activationState holds the reason */ } finally {
      this.busyKey = null
    }
  }

  openCloudEntry (e: DirectoryEntry) {
    if (e.active) {
      this.$emit('click')
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
      this.$emit('click')
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

  // -- managing -------------------------------------------------------------

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
</script>

<style lang="scss" scoped>
.muon-switcher {
  padding: 4px 0 0;

  &__title {
    display: flex;
    align-items: center;
    padding: 14px 16px 2px;
    font-size: 13px;
    font-weight: 700;

    &--discovery {
      margin-top: 10px;
      padding-top: 14px;
      border-top: 1px solid rgba(128, 128, 128, 0.18);
    }
  }

  &__heading {
    display: flex;
    align-items: center;
    padding: 10px 16px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__hint {
    margin-left: auto;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    opacity: 0.8;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__scan {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    opacity: 0.75;
    max-width: 150px;
    overflow: hidden;
    white-space: nowrap;
  }

  &__empty {
    padding: 4px 16px 8px;
    font-size: 12px;
    opacity: 0.7;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 8px;
  }
}
</style>
