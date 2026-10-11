<template>
  <section
    class="wf"
    data-tid="wifi-card"
  >
    <header class="wf__head">
      <div class="wf__titles">
        <h2>Wi-Fi</h2>
        <p v-if="!locked && !remote">
          {{ connectedNetwork ? `On ${connectedNetwork.ssid} · signal ${connectedNetwork.signal}%` : 'Not on a Wi-Fi network' }}
        </p>
      </div>
      <button
        v-if="!locked && !remote"
        type="button"
        class="wf__refresh"
        :disabled="fetching"
        aria-label="Look for networks again"
        data-tid="wifi-refresh"
        @click="fetchDevices"
      >
        <frame-icon
          name="refresh"
          small
        />
      </button>
    </header>

    <protected-notice />
    <p
      v-if="remote"
      class="wf__note"
    >
      {{ $t('app.wifi.remote_read_only') }}
    </p>

    <div
      v-if="!locked && !remote"
      class="wf__list"
      data-tid="wifi-networks"
    >
      <p
        v-if="!wifi_available_networks.length"
        class="wf__note wf__note--pad"
      >
        Looking for networks…
      </p>
      <div
        v-for="network in sortedNetworks"
        :key="network.ssid"
        class="wf__row"
        :class="{ 'wf__row--on': network.in_use }"
        :data-ssid="network.ssid"
      >
        <button
          type="button"
          class="wf__main"
          :title="networkFacts(network)"
          @click="onNetworkClick(network)"
        >
          <svg
            class="wf__bars"
            viewBox="0 0 20 16"
            aria-hidden="true"
          >
            <rect
              v-for="bar in 4"
              :key="bar"
              :x="(bar - 1) * 5"
              :y="16 - bar * 4"
              width="3.5"
              :height="bar * 4"
              rx="1"
              :class="{ 'wf__bar--on': bar <= signalLevel(network.signal) }"
            />
          </svg>
          <span class="wf__name">
            <b>{{ network.ssid }}</b>
            <span>{{ rowState(network) }}</span>
          </span>
        </button>
        <span class="wf__facts">{{ band(network) }}</span>
        <span
          v-if="network.in_use || knownSsids.has(network.ssid)"
          class="wf__actions"
        >
          <button
            v-if="network.in_use"
            type="button"
            class="wf__link"
            data-tid="wifi-disconnect"
            @click="disconnectConfirmDialog = true"
          >
            {{ $t('app.general.btn.disconnect') }}
          </button>
          <button
            type="button"
            class="wf__link wf__link--danger"
            data-tid="wifi-forget"
            @click="forget(network)"
          >
            {{ $t('app.general.btn.forget') }}
          </button>
        </span>
      </div>
    </div>

    <v-dialog
      v-model="disconnectConfirmDialog"
      max-width="420"
    >
      <div class="wf__dialog">
        <h3>{{ $t('app.wifi.modal.disconnect.title') }}</h3>
        <p v-if="!onHotspot">
          {{ $t('app.wifi.modal.disconnect.message') }}
        </p>
        <div class="wf__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="disconnectConfirmDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            @click="disconnect"
          >
            {{ $t('app.general.btn.disconnect') }}
          </button>
        </div>
      </div>
    </v-dialog>

    <v-dialog
      v-model="showWarningDialog"
      max-width="420"
    >
      <div class="wf__dialog">
        <h3>{{ $t('app.wifi.modal.warning.title') }}</h3>
        <p>{{ onHotspot ? $t('app.wifi.modal.warning.hotspot_message') : $t('app.wifi.modal.warning.message') }}</p>
        <div class="wf__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="acceptWarning_loading"
            @click="showWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="acceptWarning_loading"
            data-tid="wifi-proceed"
            @click="acceptWarning"
          >
            {{ $t('app.general.btn.Proceed') }}
          </button>
        </div>
      </div>
    </v-dialog>

    <v-dialog
      v-model="showPasswordDialog"
      max-width="420"
    >
      <div class="wf__dialog">
        <h3>{{ $t('app.general.confirm.enter_password', { ssid: selectedNetwork?.ssid }) }}</h3>
        <v-text-field
          v-model="password"
          :label="$t('app.general.label.password')"
          type="password"
          outlined
          dense
          hide-details
          @keyup.enter="connectToSelected"
        />
        <div class="wf__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="showPasswordDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="wifi-connect"
            @click="connectToSelected"
          >
            {{ $t('app.general.btn.connect') }}
          </button>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { DeviceWifi } from '@/aux_api/models/device-wifi'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
import { EventBus } from '@/eventBus'
import { moonrakerErrorMessage } from '@/store/protection/helpers'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const { onHotspot } = useHotspotCheck()

type AggWifi = DeviceWifi & { chanList?: string; freqList?: string }

@Component
export default class WifiManagerCard extends Vue {
  @Prop({ type: Boolean }) readonly menuCollapsed?: boolean

  // Dialog & connection state
  disconnectConfirmDialog = false
  showWarningDialog = false
  showPasswordDialog = false
  selectedNetwork: DeviceWifi | null = null
  password = ''

  // Menu state
  menuOpen: Record<string, boolean> = {}

  // Wi-Fi scan data
  wifi_available_networks: DeviceWifi[] = []
  knownSsids = new Set<string>()
  testedSsids = new Set<string>()
  wifiOrder: string[] = []
  private intervalId: ReturnType<typeof setInterval> | null = null

  refresh () {
    this.wifi_available_networks = []
    this.knownSsids.clear()
    this.testedSsids.clear()
    this.wifiOrder = []
  }

  get onHotspot () {
    return onHotspot.value
  }

  // MuonOS network protection is on and this browser has no identity, so
  // every Wi-Fi request would be refused. The notice says so instead, and
  // polling waits until that changes.
  get locked (): boolean {
    return this.$store.getters['protection/isLocked']
  }

  // Reached over Iroh: muon-link refuses every Aux request there, reads
  // included, and the owner decided remote callers may not change Wi-Fi
  // (setup spec 07 §3). The card makes no call and says so instead.
  get remote (): boolean {
    return printerTransportBinding.remote
  }

  @Watch('remote')
  onRemoteChanged (remote: boolean) {
    if (!remote) this.fetchDevices()
  }

  auxApi = useAuxApi()

  // Lifecycle
  mounted () {
    this.fetchDevices()
    this.intervalId = setInterval(() => this.fetchDevices(), 5000)
  }

  beforeDestroy () {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  fetching: boolean = false

  // Fetch and mark known SSIDs
  async fetchDevices () {
    if (this.fetching || this.locked || this.remote) return
    this.fetching = true
    try {
      const res = await this.auxApi.wifi.wifiScanWifiScanGet(true)
      this.wifi_available_networks = res.data

      // Skip hidden SSIDs when probing for "known" status
      for (const net of this.wifi_available_networks) {
        const ssid = (net.ssid || '').trim() // NEW
        if (!ssid) continue // NEW: hide hidden networks at source
        if (!this.knownSsids.has(ssid) && !this.testedSsids.has(ssid)) {
          try {
            await this.auxApi.wifi.getDetailsWifiShowGet(ssid)
            console.log('Known SSID:', ssid)
            this.knownSsids.add(ssid)
          } catch {
            this.testedSsids.add(ssid)
          }
        }
      }

      // —— CHANGED: “first-come” ordering now tracked by SSID (after grouping) ——
      const groups = this.groupedNetworks // NEW
      const current = new Set(groups.map(g => g.ssid)) // NEW
      const bySignal = [...groups].sort((a, b) => b.signal - a.signal)
      for (const net of bySignal) {
        if (!this.wifiOrder.includes(net.ssid)) {
          this.wifiOrder.push(net.ssid)
        }
      }
      this.wifiOrder = this.wifiOrder.filter(ssid => current.has(ssid))
      // ————————————————————————————————————————————————————————————————
    } catch (e: any) {
      console.error('Wi-Fi scan failed', e)
      if (e?.response?.status === 403) this.$store.dispatch('protection/onRefused')
    }
    this.fetching = false
  }

  // NEW: one row per SSID with merged details
  get groupedNetworks (): AggWifi[] {
    const bySsid = new Map<string, AggWifi & { _chans: Set<string>, _freqs: Set<string> }>()
    for (const n of this.wifi_available_networks) {
      const ssid = (n.ssid || '').trim()
      if (!ssid) continue // hide hidden networks altogether

      const isSecured = !!(n.security && !/^\s*open\s*$/i.test(n.security))
      if (!bySsid.has(ssid)) {
        bySsid.set(ssid, {
          ...n,
          ssid, // normalized
          in_use: !!n.in_use,
          signal: n.signal,
          rate: n.rate,
          security: isSecured ? n.security : '', // empty => “unsecured” label
          chanList: String(n.chan),
          freqList: String(n.freq),
          _chans: new Set([String(n.chan)]),
          _freqs: new Set([String(n.freq)])
        } as any)
      } else {
        const g = bySsid.get(ssid)!
        g.in_use = g.in_use || !!n.in_use
        // Prefer any secured label over “open”
        if (isSecured && (!g.security || /^\s*open\s*$/i.test(g.security))) {
          g.security = n.security
        }
        if (n.signal > g.signal) g.signal = n.signal
        if (n.rate > g.rate) g.rate = n.rate
        g._chans.add(String(n.chan))
        g._freqs.add(String(n.freq))
      }
    }

    // finalize readable lists
    for (const g of bySsid.values()) {
      g.chanList = Array.from(g._chans).join(', ')
      g.freqList = Array.from(g._freqs).join(', ')
      delete (g as any)._chans
      delete (g as any)._freqs
    }
    return Array.from(bySsid.values())
  }

  // Sorting
  get sortedNetworks (): AggWifi[] {
    const groups = this.groupedNetworks
    const connectedSsid = this.wifi_available_networks.find(n => n.in_use)?.ssid?.trim() || null
    const map = new Map(groups.map(n => [n.ssid, n]))
    const others = this.wifiOrder
      .filter(ssid => map.has(ssid) && ssid !== connectedSsid)
      .map(ssid => map.get(ssid)!)

    return connectedSsid && map.has(connectedSsid)
      ? [map.get(connectedSsid)!, ...others]
      : others
  }

  // Signal icon logic
  private getSignalLevel (signal: number): 1 | 2 | 3 | 4 {
    if (signal >= 75) return 4
    if (signal >= 50) return 3
    if (signal >= 25) return 2
    return 1
  }

  getWifiIconName (net: DeviceWifi): string {
    const lvl = this.getSignalLevel(net.signal)
    if (net.in_use) return `$wifi-strength-${lvl}`
    const sec = net.security?.toLowerCase() || ''
    const lockSuffix = (!sec || sec.includes('open')) ? '' : '-lock'
    return `$wifi-strength-${lvl}${lockSuffix}`
  }

  getSignalColor (signal: number): string {
    const lvl = this.getSignalLevel(signal)
    return lvl === 4 ? 'green' : lvl === 3 ? 'lime' : lvl === 2 ? 'orange' : 'red'
  }

  // Existing menu toggle
  openMenu (ssid: string) {
    Object.keys(this.menuOpen).forEach(k => {
      if (k !== ssid) this.menuOpen[k] = false
    })
    this.$set(this.menuOpen, ssid, true)
  }

  // Unchanged signature *usage*, but pass SSID now
  onNetworkClick (network: DeviceWifi) {
    if (network.in_use) {
      this.openMenu(network.ssid) // CHANGED (was network.bssid)
    } else {
      this.selectedNetwork = network
      // Always ask first. From the LAN, the printer leaves the network this
      // page reaches it on. On the hotspot it shares one radio, so joining a
      // network on another channel moves the hotspot and drops this phone.
      this.showWarningDialog = true
    }
  }

  acceptWarning_loading = false
  async acceptWarning () {
    this.acceptWarning_loading = true
    this.showWarningDialog = false
    try {
      await this.promptOrConnect()
    } catch {

    }
    this.acceptWarning_loading = false
  }

  async promptOrConnect () {
    if (!this.selectedNetwork) return
    const sec = this.selectedNetwork.security?.toLowerCase() || ''
    if (this.knownSsids.has(this.selectedNetwork.ssid)) {
      await this.auxApi.wifi.wifiSwitchWifiUpPost(this.selectedNetwork.ssid)
      this.refresh()
      await this.fetchDevices()
    } else if (!sec || sec.includes('open')) {
      this.connectToSelected()
    } else {
      this.password = ''
      this.showPasswordDialog = true
    }
  }

  async connectToSelected () {
    if (!this.selectedNetwork) return
    this.showPasswordDialog = false
    try {
      await this.auxApi.wifi.wifiConnectWifiConnectPost({
        ssid: this.selectedNetwork.ssid,
        password: this.password || undefined
      })
      EventBus.$emit(this.$t('app.wifi.msg.connect.success') + ' ' + this.selectedNetwork.ssid, { type: 'success', timeout: 2000 })
      await this.fetchDevices()
    } catch (err: any) {
      EventBus.$emit(`${this.$t('app.wifi.msg.connect.error')} ${moonrakerErrorMessage(err)}`, { type: 'error', timeout: 5000 })
    }
  }

  // Existing disconnect & forget
  async disconnect () {
    try {
      const resp = await this.auxApi.wifi.wifiDisconnectWifiDisconnectPost()
      if (resp.status === 200) {
        await this.fetchDevices()
      }
    } catch (err: any) {
      EventBus.$emit(`${this.$t('app.wifi.msg.disconnect.error')} ${moonrakerErrorMessage(err)}`, { type: 'error', timeout: 5000 })
    }
    this.disconnectConfirmDialog = false
  }

  // -- for the page: what each row says -------------------------------------

  get connectedNetwork (): AggWifi | null {
    return this.sortedNetworks.find(n => n.in_use) ?? null
  }

  signalLevel (signal: number): number {
    return this.getSignalLevel(signal)
  }

  rowState (network: AggWifi): string {
    if (network.in_use) return 'Connected'
    if (this.knownSsids.has(network.ssid)) return 'Saved · joins without a password'
    return network.security ? network.security : 'Open'
  }

  /** 2.4 GHz, 5 GHz, or both, from the access points heard under this name. */
  band (network: AggWifi): string {
    const freqs = String(network.freqList || network.freq).split(',').map(f => Number(f.trim())).filter(f => f > 0)
    const bands = new Set(freqs.map(f => (f < 3000 ? '2.4' : f < 5925 ? '5' : '6')))
    return bands.size ? `${[...bands].sort().join(' & ')} GHz` : ''
  }

  networkFacts (network: AggWifi): string {
    return [
      `Security: ${network.security || 'open'}`,
      `signal ${network.signal}%`,
      `${network.rate} Mbps`,
      `channel ${network.chanList || network.chan}`,
      `${network.freqList || network.freq} MHz`
    ].join(' · ')
  }

  async forget (network: DeviceWifi) {
    try {
      await this.auxApi.wifi.wifiForgetWifiForgetDelete(network.ssid)
      this.knownSsids.delete(network.ssid)
      this.testedSsids.delete(network.ssid)
      await this.fetchDevices()
    } catch (e) {
      console.error('Forget failed', e)
    }
  }
}
</script>

<style lang="scss" scoped>
  .wf {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .wf__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .wf__titles {
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .wf__refresh {
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover:not(:disabled) {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }

    &:disabled {
      opacity: 0.45;
    }
  }

  .wf__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .wf__note--pad {
    padding: 12px 4px;
  }

  .wf__list {
    display: flex;
    flex-direction: column;

    > .wf__row + .wf__row {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .wf__row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
  }

  .wf__row--on .wf__name b {
    color: var(--m3d-accent);
  }

  .wf__main {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 6px 0;
    color: var(--m3d-text);
    text-align: left;
  }

  .wf__bars {
    flex: none;
    width: 20px;
    height: 16px;

    rect {
      fill: var(--m3d-border-strong);
    }

    .wf__bar--on {
      fill: var(--m3d-text);
    }
  }

  .wf__name {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .wf__facts {
    flex: none;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .wf__actions {
    display: inline-flex;
    flex: none;
    gap: 12px;
  }

  .wf__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .wf__link--danger {
    color: var(--m3d-danger);
  }

  .wf__dialog {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    h3 {
      margin: 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .wf__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
