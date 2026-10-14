<template>
  <div
    class="printers"
    :class="{ 'printers--phone': isMobileViewport }"
  >
    <deletion-notice
      v-if="deletionPending"
      tid="printers-deletion"
    />
    <!-- Nothing saved, linked or found yet: help find the first printer. -->
    <section
      v-if="page.welcome"
      class="welcome"
      data-tid="printers-welcome"
    >
      <printer-stage
        class="welcome__stage"
        :height="isMobileViewport ? 300 : 560"
      />
      <div class="welcome__body">
        <div class="welcome__intro">
          <span class="caps caps--accent">Welcome</span>
          <h1 class="welcome__title">
            Let's find your printer
          </h1>
          <p class="welcome__lead">
            Nothing has turned up on this network yet. Keep this page open while your printer starts. It appears here by itself.
          </p>
        </div>

        <div class="welcome__search">
          <v-progress-circular
            v-if="searching"
            indeterminate
            size="16"
            width="2"
          />
          <frame-icon
            v-else
            name="wifi"
            small
          />
          <span class="welcome__search-text">
            {{ searching ? 'Looking on this network…' : 'Nothing found on this network yet.' }}
            <span
              v-if="scanNetwork"
              class="dim"
            > {{ scanNetwork }}</span>
          </span>
          <button
            type="button"
            class="btn btn--sm"
            :disabled="searching"
            data-tid="search-again"
            @click="rescan"
          >
            Search again
          </button>
        </div>

        <div class="welcome__ways">
          <div class="way">
            <span class="way__icon way__icon--accent"><frame-icon name="plus" /></span>
            <div class="way__text">
              <span class="way__title">Set up a new printer</span>
              <span class="way__about">
                Turn it on. It makes a Wi-Fi called <span class="mono">Muon-</span> and its name. Join that Wi-Fi and
                setup opens.<template v-if="bluetoothSearch"> Or find it nearby over Bluetooth.</template>
              </span>
            </div>
            <button
              v-if="bluetoothSearch && !bluetoothOff"
              type="button"
              class="btn btn--primary"
              data-tid="look-nearby"
              @click="onLookNearby"
            >
              Look nearby
            </button>
          </div>
          <div class="way">
            <span class="way__icon"><frame-icon name="search" /></span>
            <div class="way__text">
              <span class="way__title">Add one by its address</span>
              <span class="way__about">It's on the printer's screen, such as muon-boxwood-367a.local or 192.168.1.20.</span>
            </div>
            <button
              type="button"
              class="btn"
              data-tid="enter-address"
              @click="instanceDialogOpen = true"
            >
              Add by address
            </button>
          </div>
          <div class="way">
            <span class="way__icon"><frame-icon name="cloud" /></span>
            <div class="way__text">
              <span class="way__title">Sign in to reach your printers from anywhere</span>
              <span class="way__about">Optional. You don't need an account to print on this network.</span>
            </div>
            <button
              type="button"
              class="btn"
              data-tid="sign-in"
              @click="accountDialog = true"
            >
              Sign in
            </button>
          </div>
        </div>
        <p
          v-if="blockedByPage"
          class="note"
          data-tid="blocked-by-page"
        >
          This browser won't let this page reach printers by their IP address, because the page was opened by
          name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987.
        </p>
      </div>
    </section>

    <template v-else>
      <header class="printers__head">
        <div class="printers__titles">
          <h1 class="printers__title">
            Printers
          </h1>
          <p class="printers__summary">
            <span
              v-for="(part, i) in summary"
              :key="i"
              :class="part.tone ? `tone--${part.tone}` : ''"
            >{{ i ? ' · ' : '' }}{{ part.text }}</span>
          </p>
        </div>
        <div class="printers__tools">
          <div
            v-if="page.counts.printers > 1"
            class="seg"
            role="group"
            aria-label="Show"
          >
            <button
              v-for="f in filters"
              :key="f.id"
              type="button"
              :class="{ on: filter === f.id }"
              :aria-pressed="filter === f.id ? 'true' : 'false'"
              :data-tid="`filter-${f.id}`"
              @click="filter = f.id"
            >
              {{ f.label }}
            </button>
          </div>
          <div
            v-if="!isMobileViewport && page.counts.printers"
            class="seg"
            role="group"
            aria-label="View"
          >
            <button
              type="button"
              :class="{ on: view === 'cards' }"
              aria-label="Cards"
              title="Cards"
              @click="setView('cards')"
            >
              <frame-icon
                name="printers"
                small
              />
            </button>
            <button
              type="button"
              :class="{ on: view === 'list' }"
              aria-label="List"
              title="List"
              @click="setView('list')"
            >
              <frame-icon
                name="list"
                small
              />
            </button>
          </div>
          <button
            type="button"
            class="btn"
            data-tid="add-printer"
            @click="instanceDialogOpen = true"
          >
            <frame-icon
              name="plus"
              small
            />
            Add a printer
          </button>
        </div>
      </header>

      <!-- Printing now: the whole width for one, side by side for several. -->
      <section
        v-if="printingNow.length"
        class="printers__section"
        data-tid="printing-now"
      >
        <div class="section-head">
          <span class="section-head__dot" />
          <h2 class="section-head__name">
            Printing now
          </h2>
          <tone-pill
            v-if="printingNow.length > 1"
            tone="run"
            :dot="false"
          >
            {{ printingNow.length }}
          </tone-pill>
          <span
            v-if="nextToFinish"
            class="section-head__about"
          >{{ nextToFinish }}</span>
          <span class="section-head__grow" />
          <template v-if="printingNow.length > perRow && !isMobileViewport">
            <span class="section-head__about">{{ pageText }}</span>
            <button
              type="button"
              class="btn btn--sq btn--sm"
              aria-label="Previous"
              :disabled="nowPage === 0"
              @click="nowPage--"
            >
              <frame-icon
                name="chevronLeft"
                small
              />
            </button>
            <button
              type="button"
              class="btn btn--sq btn--sm"
              aria-label="Next"
              :disabled="(nowPage + 1) * perRow >= printingNow.length"
              @click="nowPage++"
            >
              <frame-icon
                name="chevronRight"
                small
              />
            </button>
          </template>
        </div>
        <printing-now-card
          v-if="printingNow.length === 1 && !isMobileViewport"
          :tile="printingNow[0]"
          variant="wide"
          :thumbnail="thumbnailFor(printingNow[0])"
          :controllable="!!printingNow[0].entry.active"
          @open="openEntry(printingNow[0].entry)"
          @pause="pausePrint()"
          @resume="resumePrint()"
          @stop="cancelPrint()"
        />
        <div
          v-else
          class="printers__now"
        >
          <printing-now-card
            v-for="tile in printingShown"
            :key="tile.key"
            :tile="tile"
            variant="card"
            :thumbnail="thumbnailFor(tile)"
            :controllable="!!tile.entry.active"
            @open="openEntry(tile.entry)"
            @pause="pausePrint()"
            @resume="resumePrint()"
            @stop="cancelPrint()"
          />
        </div>
      </section>

      <!-- Your groups, then the printers saved in this browser. -->
      <section
        v-for="g in shownGroups"
        :key="g.id"
        class="printers__section"
        :class="{ 'printers__section--drop': dropTarget === g.id }"
        :data-tid="`group-${g.id}`"
        @dragover.prevent="onDragOver(g)"
        @dragleave="dropTarget = null"
        @drop.prevent="onDrop(g)"
      >
        <div class="section-head">
          <input
            v-if="renaming === g.id"
            ref="rename"
            class="section-head__rename"
            :value="g.name"
            aria-label="Group name"
            @keydown.enter="finishRename(g.id, $event)"
            @keydown.esc="renaming = null"
            @blur="finishRename(g.id, $event)"
          >
          <h2
            v-else
            class="section-head__name"
          >
            {{ g.name }}
          </h2>
          <tone-pill
            tone="off"
            :dot="false"
          >
            {{ g.tiles.length }}
          </tone-pill>
          <span
            v-if="g.tiles.length"
            class="section-head__about"
            :class="`tone--${g.summaryTone}`"
          >{{ g.summary }}</span>
          <span class="section-head__grow" />
          <span
            v-if="g.editable && !isMobileViewport"
            class="section-head__hint"
          >Your group · drag printers in or out</span>
          <v-menu
            v-if="g.editable"
            left
            offset-y
          >
            <template #activator="{ on, attrs }">
              <button
                type="button"
                class="icon-btn"
                aria-label="Group options"
                v-bind="attrs"
                v-on="on"
              >
                <frame-icon name="more" />
              </button>
            </template>
            <v-list dense>
              <v-list-item @click="startRename(g.id)">
                <v-list-item-title>Rename</v-list-item-title>
              </v-list-item>
              <v-list-item @click="removeGroup(g.id)">
                <v-list-item-title class="error--text">
                  Remove group
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div
          :class="gridClass"
        >
          <printer-tile-card
            v-for="tile in filtered(g.tiles)"
            :key="tile.key"
            :tile="tile"
            :variant="tileVariant"
            :stage-height="printingNow.length ? 200 : 236"
            :actions="actionsFor(tile.entry)"
            :busy="busyKey === tile.key"
            :shown-above="isShownAbove(tile)"
            :draggable="canGroup && !!tile.entry.cloud"
            @open="openEntry(tile.entry)"
            @action="onAction(tile.entry, $event)"
            @dragstart="onDragStart(tile)"
            @dragend="onDragEnd"
          />
          <div
            v-if="(g.editable || g.id === 'ungrouped') && (dragging || !g.tiles.length)"
            class="drop-hint"
          >
            <frame-icon name="plus" />
            <span>{{ dropHint(g) }}</span>
          </div>
        </div>
      </section>

      <p
        v-if="!deletionPending && !shownGroups.length && filter !== 'all'"
        class="printers__none"
      >
        No printers {{ filterNone }}.
      </p>

      <!-- Found on this network: large whether or not you're signed in. -->
      <section
        class="printers__section"
        data-tid="found"
      >
        <div class="section-head">
          <frame-icon
            name="wifi"
            class="section-head__icon"
          />
          <h2 class="section-head__name">
            Found on this network
          </h2>
          <tone-pill
            v-if="page.found.length"
            tone="off"
            :dot="false"
          >
            {{ page.found.length }}
          </tone-pill>
          <span class="section-head__about">
            <template v-if="searching">
              <v-progress-circular
                indeterminate
                size="11"
                width="2"
              />
              Looking{{ scanNetwork ? ` on ${scanNetwork}` : '' }}…
            </template>
            <template v-else-if="page.found.length">Not in your printers yet</template>
            <template v-else>Nothing new on this network</template>
          </span>
          <span class="section-head__grow" />
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="searching"
            data-tid="search-again"
            @click="rescan"
          >
            <frame-icon
              name="refresh"
              small
            />
            Search again
          </button>
        </div>
        <div class="printers__found">
          <found-printer-card
            v-for="tile in page.found"
            :key="tile.key"
            :tile="tile"
            :actions="foundActions(tile.entry)"
            :busy="busyKey === tile.key"
            :stage-height="isMobileViewport ? 240 : 300"
            @action="onFoundAction(tile.entry, $event)"
          />
          <div class="not-here">
            <frame-icon
              name="search"
              large
            />
            <span class="not-here__title">Not here?</span>
            <span class="not-here__about">
              Add a printer by its address<template v-if="bluetoothSearch && !bluetoothOff">, or find one nearby over Bluetooth</template>.
            </span>
            <div class="not-here__actions">
              <button
                type="button"
                class="btn btn--sm"
                data-tid="enter-address"
                @click="instanceDialogOpen = true"
              >
                Add by address
              </button>
              <button
                v-if="bluetoothSearch && !bluetoothOff"
                type="button"
                class="btn btn--sm"
                data-tid="look-nearby"
                @click="onLookNearby"
              >
                Look nearby
              </button>
            </div>
          </div>
        </div>
        <p
          v-if="blockedByPage"
          class="note"
          data-tid="blocked-by-page"
        >
          This browser won't let this page reach printers by their IP address, because the page was opened by
          name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987.
          <template v-if="blockedByPage.ownUrl">
            Or <a :href="blockedByPage.ownUrl">open this printer by its IP address</a>, which can reach them all.
          </template>
        </p>
      </section>

      <div
        v-if="!account"
        class="inset"
      >
        <frame-icon name="cloud" />
        <span class="inset__text">
          Sign in to reach these from anywhere, sort them into groups and hear when a print finishes.
          <span class="dim">Optional.</span>
        </span>
        <button
          type="button"
          class="btn btn--sm"
          data-tid="sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>

      <section
        v-if="page.other.length"
        class="printers__section"
        data-tid="other-printers"
      >
        <div class="section-head">
          <h2 class="section-head__name">
            Other printers
          </h2>
        </div>
        <p class="foreign-subtitle">
          Saved in this browser only. They stay on this network and never go through Muon3D's servers.
        </p>
        <p
          v-if="mixedContentBlocked"
          class="foreign-warning"
        >
          Firefox and Safari block this page (https) from talking to a printer on plain http — that's mixed content. Chrome can reach printers on your network: open Fluidd in Chrome.
        </p>
        <div class="foreign-grid">
          <article
            v-for="tile in page.other"
            :key="tile.key"
            class="foreign-tile"
            role="link"
            tabindex="0"
            :aria-label="`Open ${tile.name}`"
            @click="openForeign(tile)"
            @keydown.enter.prevent="openForeign(tile)"
            @keydown.space.prevent="openForeign(tile)"
          >
            <foreign-silhouette :form-factor="foreignRecord(tile).formFactor" />
            <div class="foreign-tile__body">
              <span class="foreign-tile__name">
                {{ tile.name }}
              </span>
              <span>{{ brandLabel(tile) }}<template v-if="foreignRecord(tile).model"> · {{ foreignRecord(tile).model }}</template></span>
              <div class="foreign-tile__chips">
                <tone-pill
                  tone="off"
                  :dot="false"
                >
                  {{ foreignRecord(tile).via === 'direct' ? 'direct' : `through ${foreignRecord(tile).m1Name || 'M1'}` }}
                </tone-pill>
                <tone-pill :tone="tile.tone">
                  {{ tile.label }}
                </tone-pill>
              </div>
            </div>
            <v-menu
              left
              offset-y
            >
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="icon-btn"
                  :aria-label="`Options for ${tile.name}`"
                  v-bind="attrs"
                  v-on="on"
                  @click.stop
                  @keydown.stop
                >
                  <frame-icon name="more" />
                </button>
              </template>
              <v-list dense>
                <v-list-item @click.stop="forgetForeignPrinter(tile)">
                  <v-list-item-title class="error--text">
                    Forget
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </article>
        </div>
      </section>

      <!-- Offline: fills itself. -->
      <section
        v-if="page.offline.length"
        class="printers__section"
        data-tid="offline"
      >
        <div class="section-head">
          <h2 class="section-head__name section-head__name--muted">
            Offline
          </h2>
          <tone-pill
            tone="off"
            :dot="false"
          >
            {{ page.offline.length }}
          </tone-pill>
        </div>
        <div class="printers__offline">
          <div
            v-for="tile in page.offline"
            :key="tile.key"
            class="offline"
          >
            <printer-thumb
              :size="72"
              state="offline"
            />
            <div class="offline__text">
              <span class="offline__name">{{ tile.name }}</span>
              <span class="offline__detail">{{ tile.detail }}</span>
              <span class="offline__hint">Is it switched on and on Wi-Fi?</span>
            </div>
            <v-menu
              v-if="actionsFor(tile.entry).length"
              left
              offset-y
            >
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="icon-btn"
                  :aria-label="`Options for ${tile.name}`"
                  v-bind="attrs"
                  v-on="on"
                >
                  <frame-icon name="more" />
                </button>
              </template>
              <v-list dense>
                <v-list-item
                  v-for="a in actionsFor(tile.entry)"
                  :key="a.id"
                  :disabled="a.disabled"
                  @click="onAction(tile.entry, a.id)"
                >
                  <v-list-item-title :class="{ 'error--text': a.danger }">
                    {{ a.label }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </section>

      <button
        v-if="canGroup"
        type="button"
        class="new-group"
        data-tid="new-group"
        @click="addGroup"
      >
        <frame-icon
          name="plus"
          small
        />
        New group
      </button>
    </template>

    <p
      v-if="notice"
      class="note"
    >
      {{ notice }}
    </p>
    <p
      v-if="nearby.error"
      class="note note--error"
    >
      {{ nearby.error }}
    </p>
    <p
      v-if="activationError"
      class="note note--error"
    >
      {{ activationError }}
      <template v-if="activationFallback">
        <a :href="activationFallback">Open the printer's own page</a> instead.
      </template>
    </p>

    <add-instance-dialog
      v-if="instanceDialogOpen"
      v-model="instanceDialogOpen"
      :found="foundChoices"
      :searching="searching"
      @resolve="openInstance"
      @pick="onPickFound"
      @saved="refreshForeignPrinters"
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
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import BrowserMixin from '@/mixins/browser'
import FilesMixin from '@/mixins/files'
import { cloudState, saveLayout } from '@/services/muon-cloud/state'
import { discoverPrinters, discoveryState, lanAddresses, refreshKnownPrinters } from '@/services/muon-cloud/discovery'
import { foreignEntries, savedUpdates, type Directory, type DirectoryEntry } from '@/services/muon-cloud/directory'
import { startNearby, stopNearby } from '@/services/muon-ble/nearby'
import { printerHomePath, foreignSlugForId } from '@/services/printer-pages'
import { saveSnapshotPrinters, snapshotPrinter } from '@/services/startup/snapshot'
import {
  needsYou,
  printersPage,
  type PrintersPage,
  type PrinterTile,
  type TileGroup,
  type TileJob,
  type TileTone
} from '@/services/printers-page/model'
import type { TimeEstimates } from '@/store/printer/types'
import { shortDuration } from '@/util/short-duration'
import { eventTargetIsContentEditable } from '@/util/event-helpers'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'
import BluetoothSetupDialog from '@/components/muon-ble/BluetoothSetupDialog.vue'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'
import PrinterStage from '@/components/printers/PrinterStage.vue'
import PrinterTileCard from '@/components/printers/PrinterTileCard.vue'
import PrintingNowCard from '@/components/printers/PrintingNowCard.vue'
import FoundPrinterCard from '@/components/printers/FoundPrinterCard.vue'
import TonePill from '@/components/printers/TonePill.vue'
import type { FoundChoice } from '@/components/common/AddInstanceDialog.vue'
import ForeignSilhouette from '@/components/foreign/ForeignSilhouette.vue'
import { liveForeign, loadForeign, connectAll, forget as forgetForeign } from '@/services/foreign-printers/live'
import { foreignBrand } from '@/services/foreign-printers/brands'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import { blocksForeignHttp } from '@/util/browser-family'
import { pageBlocksPrinter } from '@/util/page-blocks-printer'

type Filter = 'all' | 'printing' | 'ready' | 'needs'
type View = 'cards' | 'list'

/** How often the printers already known are asked again while the page is open. */
const HEALTH_EVERY_MS = 15_000
const VIEW_KEY = 'muon3d.printers.view'

function readView (): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

/**
 * Printers (`/`): every printer, in one place (U1, U6). What is printing
 * now leads, the whole width for one and side by side for several; then
 * your groups; then what was found on this network, large, whether or not
 * you're signed in; then what is offline. With nothing yet, it welcomes
 * and helps find the first printer.
 */
@Component({
  components: {
    DeletionNotice: () => import('@/components/account/DeletionNotice.vue'),
    CloudAccountDialog,
    LinkPrinterDialog,
    BluetoothSetupDialog,
    AccessRequestDialog,
    PrinterStage,
    PrinterTileCard,
    PrintingNowCard,
    FoundPrinterCard,
    TonePill,
    ForeignSilhouette
  }
})
export default class Printers extends Mixins(PrinterEntriesMixin, BrowserMixin, FilesMixin) {
  filter: Filter = 'all'
  view: View = readView()
  nowPage = 0
  dragging: string | null = null
  dropTarget: string | null = null
  renaming: string | null = null
  timer: number | null = null

  filters: Array<{ id: Filter, label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'printing', label: 'Printing' },
    { id: 'ready', label: 'Ready' },
    { id: 'needs', label: 'Needs you' }
  ]

  created () {
    loadForeign().then(() => connectAll()).catch(() => {})
    if (new URLSearchParams(location.search).get('addPrinter') === '1') this.instanceDialogOpen = true
    discoverPrinters().catch(() => {})
    startNearby().catch(() => {})
    this.timer = window.setInterval(() => { refreshKnownPrinters().catch(() => {}) }, HEALTH_EVERY_MS)
    window.addEventListener('keydown', this.onDigit)
  }

  beforeDestroy () {
    if (this.timer !== null) window.clearInterval(this.timer)
    window.removeEventListener('keydown', this.onDigit)
    stopNearby()
  }

  /** The printers in the groups, in the order shown, each once: 1 to 9 open them. */
  get numbered (): PrinterTile[] {
    const seen = new Set<string>()
    const out: PrinterTile[] = []
    for (const g of this.shownGroups) {
      for (const t of this.filtered(g.tiles)) {
        if (!seen.has(t.key)) {
          seen.add(t.key)
          out.push(t)
        }
      }
    }
    return out
  }

  onDigit (event: KeyboardEvent) {
    if (!this.$store.state.config.uiSettings.general.enableKeyboardShortcuts) return
    if (event.ctrlKey || event.metaKey || event.altKey || eventTargetIsContentEditable(event)) return
    if (!/^[1-9]$/.test(event.key)) return
    const tile = this.numbered[Number(event.key) - 1]
    if (!tile) return
    event.preventDefault()
    this.openEntry(tile.entry)
  }

  /** Opened from here, a printer's own page follows. */
  afterOpen () {
    this.$router.push(printerHomePath()).catch(() => {})
  }

  /** The print on the printer Fluidd is on now, from its own socket. */
  get activeJob (): TileJob | null {
    if (!this.printerPrinting && !this.printerPaused) return null
    const printer = this.$store.state.printer.printer
    const estimates = this.$store.getters['printer/getTimeEstimates'] as TimeEstimates
    const left = (estimates.eta - Date.now()) / 1000
    return {
      file: printer.print_stats?.filename || null,
      progress: Math.floor((this.$store.getters['printer/getPrintProgress'] as number) * 100),
      secondsLeft: left > 0 ? left : null,
      layer: (this.$store.getters['printer/getPrintLayer'] as number) || null,
      layers: (this.$store.getters['printer/getPrintLayers'] as number) || null,
      nozzle: typeof printer.extruder?.temperature === 'number' ? Math.round(printer.extruder.temperature) : null,
      bed: typeof printer.heater_bed?.temperature === 'number' ? Math.round(printer.heater_bed.temperature) : null
    }
  }

  get page (): PrintersPage {
    const directory: Directory = {
      ...this.directory,
      foreign: foreignEntries(liveForeign.records.map(r => ({ record: r, status: liveForeign.status[r.id] ?? null })))
    }
    return printersPage({
      directory,
      groups: this.account && !this.deletionPending ? cloudState.layout.groups : [],
      status: cloudState.status,
      activeJob: this.activeJob,
      signedIn: !!this.account
    })
  }

  get mixedContentBlocked (): boolean {
    return blocksForeignHttp() && this.page.other.some(tile => pageBlocksPrinter(`http://${tile.entry.host}`))
  }

  brandLabel (tile: PrinterTile): string {
    return foreignBrand(tile.entry.foreign!.record.kind).label
  }

  foreignRecord (tile: PrinterTile): ForeignPrinterRecord {
    return tile.entry.foreign!.record
  }

  openForeign (tile: PrinterTile) {
    const slug = foreignSlugForId(tile.entry.foreign!.record.id)
    if (slug) this.$router.push(`/${slug}`).catch(() => {})
  }

  async forgetForeignPrinter (tile: PrinterTile) {
    const name = tile.entry.foreign!.record.name
    if (await this.$confirm(`Fluidd forgets ${name} in this browser.`, { title: `Forget ${name}?`, buttonTrueText: 'Forget', danger: true })) {
      await forgetForeign(tile.entry.foreign!.record.id)
    }
  }

  async refreshForeignPrinters () {
    const live = await import('@/services/foreign-printers/live')
    await live.refreshForeign()
    await live.connectAll()
  }

  /** The tiles kept for the next load's cached view (KAN-525), saved a second after the page settles. */
  snapshotTimer = 0

  @Watch('page')
  onPageSnapshot () {
    clearTimeout(this.snapshotTimer)
    this.snapshotTimer = window.setTimeout(() => {
      const tiles = [
        this.page.printingNow,
        this.page.groups.map(g => g.tiles),
        this.page.found,
        this.page.offline
      ].flat(2)
      const seen = new Set<string>()
      saveSnapshotPrinters(tiles.filter(t => t.key && !seen.has(t.key) && !!seen.add(t.key)).map(snapshotPrinter))
    }, 1000)
  }

  /** "7 printers · 1 printing · 5 ready · 1 needs you · 1 offline · 2 found nearby". */
  get summary (): Array<{ text: string, tone?: TileTone }> {
    const c = this.page.counts
    const parts: Array<{ text: string, tone?: TileTone }> = []
    parts.push({ text: c.printers === 1 ? '1 printer' : `${c.printers} printers` })
    if (c.printing) parts.push({ text: `${c.printing} printing`, tone: 'run' })
    if (c.ready) parts.push({ text: `${c.ready} ready` })
    if (c.needsYou) parts.push({ text: `${c.needsYou} needs you`, tone: 'warn' })
    if (c.offline) parts.push({ text: `${c.offline} offline` })
    if (c.found) parts.push({ text: `${c.found} more found nearby` })
    return parts
  }

  get printingNow (): PrinterTile[] {
    const all = this.page.printingNow
    if (this.filter === 'ready') return []
    if (this.filter === 'needs') return all.filter(t => needsYou(t.state))
    return all
  }

  get perRow (): number {
    return this.$vuetify.breakpoint.lgAndUp ? 3 : 2
  }

  get printingShown (): PrinterTile[] {
    if (this.isMobileViewport || this.printingNow.length <= this.perRow) return this.printingNow
    const start = Math.min(this.nowPage * this.perRow, Math.max(0, this.printingNow.length - this.perRow))
    return this.printingNow.slice(start, start + this.perRow)
  }

  get pageText (): string {
    const start = Math.min(this.nowPage * this.perRow, Math.max(0, this.printingNow.length - this.perRow))
    return `${start + 1}–${start + this.printingShown.length} of ${this.printingNow.length}`
  }

  /** "next to finish: Walnut in 3m". */
  get nextToFinish (): string | null {
    const timed = this.printingNow.filter(t => t.state === 'printing' && t.job?.secondsLeft)
    if (timed.length < 2) return null
    const next = timed.reduce((a, b) => (a.job!.secondsLeft! <= b.job!.secondsLeft! ? a : b))
    return `next to finish: ${next.name} in ${shortDuration(next.job!.secondsLeft!)}`
  }

  get shownGroups (): TileGroup[] {
    // An empty "Not in a group" is only a place to drop, so it shows while dragging.
    const groups = this.page.groups.filter(g => g.tiles.length || g.id !== 'ungrouped' || this.dragging)
    if (this.filter === 'all') return groups
    return groups.filter(g => this.filtered(g.tiles).length || (g.id === 'ungrouped' && this.dragging))
  }

  dropHint (g: TileGroup): string {
    if (g.id === 'ungrouped') return 'Drop a printer here to take it out of its group'
    return g.tiles.length ? 'Drop a printer here' : 'Drag printers here'
  }

  filtered (tiles: PrinterTile[]): PrinterTile[] {
    switch (this.filter) {
      case 'printing': return tiles.filter(t => t.state === 'printing' || t.state === 'paused')
      case 'ready': return tiles.filter(t => t.state === 'ready')
      case 'needs': return tiles.filter(t => needsYou(t.state))
      default: return tiles
    }
  }

  get filterNone (): string {
    return { all: '', printing: 'printing', ready: 'ready', needs: 'need you' }[this.filter]
  }

  /** Small cards when two or more print, so the groups still fit beneath them. */
  get tileVariant (): 'card' | 'compact' | 'row' {
    if (this.isMobileViewport || this.view === 'list') return 'row'
    return this.printingNow.length > 1 ? 'compact' : 'card'
  }

  get gridClass (): string {
    return `printers__grid printers__grid--${this.tileVariant}`
  }

  isShownAbove (tile: PrinterTile): boolean {
    return this.printingNow.length === 1 && this.printingNow[0].key === tile.key
  }

  setView (view: View) {
    this.view = view
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // The choice holds for this visit.
    }
  }

  /** The part's picture, for the printer Fluidd is on (its file is on that printer). */
  thumbnailFor (tile: PrinterTile): string | null {
    if (!tile.entry.active) return null
    const file = this.$store.state.printer.printer.current_file
    if (!file?.thumbnails?.length) return null
    return this.getThumbUrl(file, 'gcodes', file.path, true, file.modified) ?? null
  }

  /** What Add a printer offers in one tap: the printers found here that it can open. */
  get foundChoices (): FoundChoice[] {
    return this.page.found
      .filter(t => t.entry.row?.action === 'open' && !!t.entry.host)
      .map(t => ({ key: t.key, name: t.name, detail: t.entry.host ?? t.detail }))
  }

  onPickFound (key: string) {
    const tile = this.page.found.find(t => t.key === key)
    if (tile) this.openFoundEntry(tile.entry)
  }

  onFoundAction (e: DirectoryEntry, id: string) {
    if (id === 'set-up' || id === 'nearby-info') return this.openFoundEntry(e)
    return this.onAction(e, id)
  }

  // -- groups (the account's, U6) --------------------------------------------

  get canGroup (): boolean {
    return !!this.account && !this.deletionPending
  }

  persistGroups (groups: Array<{ id: string, name: string, printers: string[] }>) {
    saveLayout({ ...cloudState.layout, groups })
  }

  addGroup () {
    const id = `g${Date.now().toString(36)}`
    const groups = cloudState.layout.groups
    this.persistGroups([...groups, { id, name: `Group ${groups.length + 1}`, printers: [] }])
    this.startRename(id)
  }

  startRename (id: string) {
    this.renaming = id
    this.$nextTick(() => {
      const input = (this.$refs.rename as HTMLInputElement[] | undefined)?.[0]
      input?.focus()
      input?.select()
    })
  }

  finishRename (id: string, event: Event) {
    if (this.renaming !== id) return
    this.renaming = null
    const name = (event.target as HTMLInputElement).value.trim()
    if (!name) return
    this.persistGroups(cloudState.layout.groups.map(g => (g.id === id ? { ...g, name } : g)))
  }

  removeGroup (id: string) {
    this.persistGroups(cloudState.layout.groups.filter(g => g.id !== id))
  }

  onDragStart (tile: PrinterTile) {
    this.dragging = tile.entry.cloud?.id ?? null
  }

  onDragEnd () {
    this.dragging = null
    this.dropTarget = null
  }

  onDragOver (g: TileGroup) {
    if (this.dragging && (g.editable || g.id === 'ungrouped')) this.dropTarget = g.id
  }

  /** Into one of your groups, or out of them all onto Not in a group. */
  onDrop (g: TileGroup) {
    const id = this.dragging
    this.onDragEnd()
    if (!id || !(g.editable || g.id === 'ungrouped')) return
    const groups = cloudState.layout.groups.map(x => ({ ...x, printers: x.printers.filter(p => p !== id) }))
    const target = groups.find(x => x.id === g.id)
    if (target) target.printers.push(id)
    this.persistGroups(groups)
  }

  // -- keeping saved printers current ----------------------------------------

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
  .printers {
    display: flex;
    flex-direction: column;
    gap: 32px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 12px 16px 40px;
    color: var(--m3d-text);
  }

  .printers--phone {
    gap: 22px;
    padding: 4px 0 24px;
  }

  .foreign-subtitle,
  .foreign-warning {
    margin: 0;
    color: var(--m3d-text-muted);
  }

  .foreign-warning {
    color: var(--m3d-warning);
  }

  .foreign-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }

  .foreign-tile {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 18px;
    background: var(--m3d-surface);
    cursor: pointer;
  }

  .foreign-tile:focus-visible {
    outline: 2px solid var(--m3d-accent);
    outline-offset: 2px;
  }

  .foreign-tile__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .foreign-tile__chips {
    display: flex;
    align-self: flex-start;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .foreign-tile__chips .tone-pill {
    align-self: flex-start;
  }

  .foreign-tile__name {
    overflow: hidden;
    color: var(--m3d-text);
    font-size: 16px;
    font-weight: 600;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .caps {
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .caps--accent {
    color: var(--m3d-accent);
  }

  .mono {
    font-family: var(--m3d-font-mono);
  }

  .dim {
    color: var(--m3d-text-subtle);
  }

  .tone--run { color: var(--m3d-accent); }
  .tone--ok { color: var(--m3d-success); }
  .tone--warn { color: var(--m3d-warning); }
  .tone--err { color: var(--m3d-danger); }
  .tone--off { color: var(--m3d-text-muted); }

  // -- buttons ----------------------------------------------------------------

  .btn {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &:hover:not(:disabled) {
      filter: brightness(1.12);
    }
  }

  .btn--sm {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
  }

  .btn--primary {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  .btn--ghost {
    background: transparent;
    color: var(--m3d-text-muted);
  }

  .btn--sq {
    width: 32px;
    padding: 0;
  }

  .icon-btn {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  .seg {
    display: inline-flex;
    flex: none;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--m3d-surface-2);

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 14px;
      border-radius: 9px;
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    button.on {
      background: var(--m3d-fill-strong, var(--m3d-border-strong));
      color: var(--m3d-text);
    }
  }

  // -- head -------------------------------------------------------------------

  .printers__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .printers__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .printers__title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
  }

  .printers__summary {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .printers__tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .printers--phone .printers__tools {
    width: 100%;

    .seg {
      flex: 1 1 auto;
      overflow-x: auto;
    }

    .btn {
      flex: 1 1 auto;
    }
  }

  // -- sections ---------------------------------------------------------------

  .printers__section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    border-radius: 26px;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease);
  }

  .printers__section--drop {
    box-shadow: 0 0 0 2px var(--m3d-accent), 0 0 0 10px var(--m3d-accent-soft);
  }

  .section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 40px;
  }

  .section-head__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--m3d-accent);
  }

  .section-head__icon {
    color: var(--m3d-text-muted);
  }

  .section-head__name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .printers--phone .section-head__name {
    font-size: 17px;
  }

  .section-head__name--muted {
    color: var(--m3d-text-muted);
  }

  .section-head__rename {
    min-width: 0;
    padding: 2px 8px;
    border: 0;
    border-radius: 8px;
    outline: 2px solid var(--m3d-accent);
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 20px;
    font-weight: 700;
  }

  .section-head__about {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .section-head__grow {
    flex: 1 1 auto;
  }

  .section-head__hint {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  // -- grids ------------------------------------------------------------------

  .printers__grid {
    display: grid;
    gap: 16px;
  }

  .printers__grid--card {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .printers__grid--compact {
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 12px;
  }

  .printers__grid--row {
    gap: 0;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .printers__now {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  // A phone swipes through what is printing; the next card peeks in.
  .printers--phone .printers__now {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    > * {
      flex: 0 0 86%;
      scroll-snap-align: start;
    }

    > :only-child {
      flex-basis: 100%;
    }
  }

  .printers__found {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .drop-hint,
  .not-here {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 120px;
    padding: 24px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 22px;
    color: var(--m3d-text-subtle);
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }

  .printers__grid--row .drop-hint {
    min-height: 60px;
    border: 0;
  }

  .not-here__title {
    color: var(--m3d-text-muted);
    font-size: 15px;
  }

  .not-here__about {
    font-size: 13px;
    font-weight: 400;
  }

  .not-here__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .printers__none {
    margin: 0;
    color: var(--m3d-text-muted);
  }

  // -- offline ----------------------------------------------------------------

  .printers__offline {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 420px));
    gap: 16px;
  }

  .offline {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .offline__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .offline__name {
    color: var(--m3d-text-muted);
    font-size: 17px;
    font-weight: 600;
  }

  .offline__detail,
  .offline__hint {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .offline__hint {
    font-size: 12px;
  }

  // -- notes ------------------------------------------------------------------

  .inset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .inset__text {
    flex: 1 1 240px;
    font-size: 14px;
  }

  .note {
    margin: 0;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-text);
    font-size: 14px;
  }

  .note--error {
    background: color-mix(in srgb, var(--m3d-danger) 14%, transparent);
  }

  .new-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: 8px 4px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    font-weight: 600;

    &:hover {
      color: var(--m3d-text);
    }
  }

  // -- welcome ----------------------------------------------------------------

  .welcome {
    display: grid;
    grid-template-columns: minmax(280px, 520px) minmax(0, 1fr);
    gap: 48px;
    align-items: start;
    padding-top: 12px;
  }

  .printers--phone .welcome {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .welcome__body {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }

  .welcome__intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .welcome__title {
    margin: 0;
    font-size: 44px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .printers--phone .welcome__title {
    font-size: 32px;
  }

  .welcome__lead {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 17px;
  }

  .welcome__search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .welcome__search-text {
    flex: 1 1 0;
    min-width: 0;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .welcome__ways {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .way {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .way__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .way__icon--accent {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .way__text {
    display: flex;
    flex: 1 1 220px;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .way__title {
    font-size: 17px;
    font-weight: 600;
  }

  .way__about {
    color: var(--m3d-text-muted);
    font-size: 14px;
  }
</style>
