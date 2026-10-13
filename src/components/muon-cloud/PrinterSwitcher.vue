<template>
  <div class="muon-switcher">
    <div class="muon-switcher__find">
      <label class="muon-switcher__field">
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="query"
          type="search"
          placeholder="Find a printer"
          aria-label="Find a printer"
          data-tid="find-printer"
        >
      </label>
    </div>

    <section class="muon-switcher__group">
      <div class="muon-switcher__heading">
        <span class="muon-switcher__caps">Your printers</span>
        <span
          v-if="account"
          class="muon-switcher__hint"
        >{{ account.email }}</span>
      </div>
      <deletion-notice
        v-if="deletionPending"
        tid="switcher-deletion"
      />
      <template v-else-if="account">
        <printer-card
          v-for="e in cloudEntries"
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
          No printers are linked to this account yet. Link one from its menu below.
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
    </section>

    <section class="muon-switcher__group">
      <div class="muon-switcher__heading">
        <span class="muon-switcher__caps">Saved in this browser</span>
      </div>
      <printer-card
        v-for="e in localEntries"
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
    </section>

    <section class="muon-switcher__group">
      <div class="muon-switcher__heading">
        <span class="muon-switcher__caps">Found on this network</span>
        <span
          v-if="searching"
          class="muon-switcher__scan"
        >
          <v-progress-circular
            indeterminate
            size="11"
            width="2"
          />
          {{ scanNetwork || 'searching' }}
        </span>
        <button
          v-else
          type="button"
          class="muon-switcher__again"
          title="Search again"
          aria-label="Search again"
          data-tid="search-again"
          @click="rescan"
        >
          <frame-icon
            name="refresh"
            small
          />
        </button>
      </div>
      <printer-card
        v-for="e in foundEntries"
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
      <div
        v-if="blockedByPage"
        class="muon-switcher__note"
        data-tid="blocked-by-page"
      >
        This browser won't let this page reach printers by their IP address, because the page was opened by
        name. Add another printer by its name instead, as shown on its screen, such as muon-walnut-8987.
        <template v-if="blockedByPage.ownUrl">
          Or <a :href="blockedByPage.ownUrl">open this printer by its IP address</a>, which can reach them all.
        </template>
      </div>

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
    </section>

    <div
      v-if="notice"
      class="muon-switcher__note"
    >
      {{ notice }}
    </div>
    <div
      v-if="nearby.error"
      class="muon-switcher__note muon-switcher__note--error"
    >
      {{ nearby.error }}
    </div>
    <div
      v-if="activationError"
      class="muon-switcher__note muon-switcher__note--error"
    >
      {{ activationError }}
      <template v-if="activationFallback">
        <a :href="activationFallback">Open the printer's own page</a> instead.
      </template>
    </div>

    <div class="muon-switcher__foot">
      <router-link
        to="/"
        class="muon-switcher__all"
        data-tid="all-printers"
        @click.native="$emit('click')"
      >
        <frame-icon
          name="printers"
          small
        />
        All printers
        <template v-if="enableKeyboardShortcuts">
          <kbd>G</kbd><kbd>P</kbd>
        </template>
      </router-link>
      <button
        type="button"
        class="muon-switcher__add"
        data-tid="enter-address"
        @click="instanceDialogOpen = true"
      >
        <frame-icon
          name="plus"
          small
        />
        Add a printer
      </button>
    </div>

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
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import { discoverPrinters, discoveryState, lanAddresses, refreshKnownPrinters } from '@/services/muon-cloud/discovery'
import { savedUpdates, type DirectoryEntry } from '@/services/muon-cloud/directory'
import { startNearby, stopNearby } from '@/services/muon-ble/nearby'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'
import PrinterCard from './PrinterCard.vue'
import BluetoothSetupDialog from '@/components/muon-ble/BluetoothSetupDialog.vue'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'

/** How often the printers already known are asked again while the switcher is open. */
const HEALTH_EVERY_MS = 15_000

/**
 * Every printer, as the header's switcher opens it: your account's, those
 * saved in this browser, and those found on this network. `printerDirectory`
 * decides which group a printer is in, so a printer seen through the
 * account, a saved address and this network lists once.
 */
@Component({ components: { CloudAccountDialog, LinkPrinterDialog, PrinterCard, BluetoothSetupDialog, AccessRequestDialog, DeletionNotice: () => import('@/components/account/DeletionNotice.vue') } })
export default class PrinterSwitcher extends Mixins(PrinterEntriesMixin) {
  /** Whether the switcher is open. The health checks run only while it is. */
  @Prop({ type: Boolean, default: true })
  readonly visible!: boolean

  /** "Find a printer": by name or address. */
  query = ''
  timer: number | null = null

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  /** By name, or by any address it answers at or was saved at (an offline printer has no host now). */
  matches (e: DirectoryEntry): boolean {
    const q = this.query.trim().toLowerCase()
    if (!q) return true
    const addresses = [e.host ?? '', ...e.saved.map(s => s.apiUrl)]
    return e.name.toLowerCase().includes(q) || addresses.some(a => a.toLowerCase().includes(q))
  }

  get cloudEntries (): DirectoryEntry[] {
    return this.directory.cloud.filter(this.matches)
  }

  get localEntries (): DirectoryEntry[] {
    return this.directory.local.filter(this.matches)
  }

  get foundEntries (): DirectoryEntry[] {
    return this.directory.found.filter(this.matches)
  }

  // Searching on mount swept the network on every load: about 510 requests
  // over 24 s, which also stalled a reload's own first request by 3-5 s
  // (measured 2026-10-09). It searches when the switcher is opened instead.
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
}
</script>

<style lang="scss" scoped>
.muon-switcher {
  display: flex;
  flex-direction: column;
  color: var(--m3d-text);

  &__find {
    padding: 14px 14px 6px;
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  &__group {
    padding: 0 8px;
  }

  &__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 32px;
    padding: 10px 10px 4px;
  }

  &__caps {
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  &__hint {
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__scan {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    white-space: nowrap;
  }

  &__again {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  &__empty {
    padding: 4px 10px 10px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  &__note {
    margin: 4px 10px 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-text);
    font-size: 13px;
  }

  &__note--error {
    background: color-mix(in srgb, var(--m3d-danger) 14%, transparent);
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding: 12px 14px;
    border-top: 1px solid var(--m3d-border);
  }

  &__all,
  &__add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  &__all {
    color: var(--m3d-text-muted) !important;

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text) !important;
    }

    kbd + kbd {
      margin-left: -4px;
    }
  }

  &__add {
    background: var(--m3d-surface-2);
    color: var(--m3d-text);

    &:hover {
      background: var(--m3d-hover);
    }
  }
}
</style>
