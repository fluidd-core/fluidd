<template>
  <v-dialog
    v-model="open"
    max-width="480"
    :persistent="step === 'confirm' && !deleting"
  >
    <v-card class="muon-cloud-dialog">
      <template v-if="deleting">
        <deletion-notice tid="link-deletion" />
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="open = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </template>
      <template v-else-if="step === 'choose'">
        <v-card-title>Link a printer to your account</v-card-title>
        <v-card-subtitle class="pt-1">
          Enter the six-digit code the printer's screen shows while it is linking, or scan its
          QR code with your phone. Then confirm on the printer with the knob.
        </v-card-subtitle>

        <v-card-text>
          <div class="muon-cloud-dialog__label">
            Show the code on a printer near you
            <v-spacer />
            <span
              v-if="searching"
              class="muon-cloud-dialog__scan"
            >
              <v-progress-circular
                indeterminate
                size="11"
                width="2"
                class="mr-1"
              />
              Searching
            </span>
            <v-btn
              v-else
              x-small
              text
              @click="rescan"
            >
              Search again
            </v-btn>
          </div>
          <v-list
            v-if="nearby.length"
            dense
            class="mb-2 muon-cloud-dialog__list"
          >
            <v-list-item
              v-for="p in nearby"
              :key="p.key"
              :disabled="busy || !p.canShow"
              @click="showCode(p)"
            >
              <v-list-item-icon>
                <v-progress-circular
                  v-if="asking === p.key"
                  indeterminate
                  size="20"
                  width="2"
                />
                <v-icon v-else>
                  {{ icons.printer }}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ p.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ p.note }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <div
            v-else
            class="muon-cloud-dialog__empty mb-2"
          >
            {{ searching ? 'Looking for Muon3D printers…' : 'No Muon3D printers found on your network.' }}
          </div>
          <div
            v-if="shown"
            class="text-caption mb-3"
          >
            {{ shown }}
          </div>

          <div class="muon-cloud-dialog__label">
            Or enter the code on the printer's screen
          </div>
          <v-otp-input
            v-model="code"
            length="6"
            type="number"
            :disabled="busy"
            @finish="claim(code)"
          />
          <div class="text-caption text--secondary mt-1">
            Scanning the QR code on the screen with your phone opens this page with the code filled in.
          </div>
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mt-3 mb-0"
          >
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="open = false"
          >
            Cancel
          </v-btn>
          <app-btn
            color="primary"
            :disabled="code.length !== 6"
            :loading="busy"
            @click="claim(code)"
          >
            Link
          </app-btn>
        </v-card-actions>
      </template>

      <template v-else-if="step === 'confirm'">
        <v-card-title>Confirm on the printer</v-card-title>
        <v-card-text>
          <div class="muon-cloud-confirm">
            <v-progress-circular
              indeterminate
              size="36"
              width="3"
              color="primary"
            />
            <div>
              <div class="text-subtitle-1">
                {{ claimed && claimed.name }}
              </div>
              <div class="text-body-2 text--secondary">
                The printer's screen is asking whether to link it to
                <strong>{{ accountEmail }}</strong>. Turn the knob to <strong>Confirm</strong> and press it.
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="reset"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </template>

      <template v-else-if="step === 'done'">
        <v-card-title>{{ claimed && claimed.name }} is linked</v-card-title>
        <v-card-text>
          You can reach it from anywhere you are signed in. It appears under
          <strong>Cloud</strong> in the printer list and in <strong>Fleet</strong>.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="open = false"
          >
            Close
          </v-btn>
          <app-btn
            color="primary"
            @click="openPrinter"
          >
            Open it now
          </app-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import { cloudApi } from '@/services/muon-cloud/api'
import { deletionState } from '@/services/muon-cloud/deletion'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  lanCodeOutcome,
  lanLinkAvailability,
  refreshCloudNearby,
  refreshLinkStates,
  sameNamedPrinter,
  showLanCode,
  type CloudNearbyPrinter,
  type LanPrinter
} from '@/services/muon-cloud/discovery'

@Component({ components: { DeletionNotice: () => import('@/components/account/DeletionNotice.vue') } })
export default class LinkPrinterDialog extends Vue {
  get deleting (): boolean {
    return deletionState.deleteAfter !== null
  }

  @Watch('deleting')
  onDeleting (value: boolean) {
    if (value) this.reset()
  }

  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: '' })
  readonly initialCode!: string

  /** A printer the service found on this network, to ask for a code as soon as the dialog opens. */
  @Prop({ type: String, default: '' })
  readonly initialPrinterId!: string

  /** A printer the LAN search found, by address, to ask for a code as soon as the dialog opens. */
  @Prop({ type: String, default: '' })
  readonly initialHost!: string

  step: 'choose' | 'confirm' | 'done' = 'choose'
  code = ''
  busy = false
  error: string | null = null
  claimed: { printer_id: string, name: string } | null = null
  asking: string | null = null
  /** What the printer just asked for a code is doing, as a sentence. */
  shown = ''
  timer: number | null = null
  icons = { printer: '$printer3d' }

  get accountEmail () {
    return cloudState.account?.email ?? ''
  }

  /**
   * Printers near this browser that could show a code: from the service, and
   * from the LAN search where the page can run one. Each may be linked already.
   */
  get nearby (): Array<{ key: string, name: string, note: string, canShow: boolean, cloud?: CloudNearbyPrinter, lan?: LanPrinter }> {
    const out: Array<{ key: string, name: string, note: string, canShow: boolean, cloud?: CloudNearbyPrinter, lan?: LanPrinter }> = []
    for (const c of discoveryState.cloud) {
      const mine = cloudState.printers.some(p => p.id === c.printerId)
      out.push({
        key: c.printerId,
        name: c.name,
        cloud: c,
        canShow: !c.linked,
        note: !c.linked
          ? 'Not linked · show its code'
          : mine ? 'Already in your account' : 'Linked to another account · its owner must unlink it first'
      })
    }
    for (const l of discoveryState.found) {
      if (discoveryState.cloud.some(c => sameNamedPrinter(c.name, l.name))) continue
      const { canShow, note } = lanLinkAvailability(l.link)
      out.push({ key: l.host, name: l.name, lan: l, canShow, note: `${l.host} · ${note}` })
    }
    return out
  }

  get searching () {
    return discoveryState.scanning || !discoveryState.cloudChecked
  }

  created () {
    if (this.deleting) return
    this.code = (this.initialCode || '').replace(/\D/g, '').slice(0, 6)
    if (this.code.length === 6) this.claim(this.code)
    else if (this.initialPrinterId) this.askForCode(this.initialPrinterId, this.initialPrinterId)
    else if (this.initialHost) {
      const lan = discoveryState.found.find(l => l.host === this.initialHost)
      if (lan) this.showCode({ key: lan.host, name: lan.name, lan })
    }
    refreshLinkStates().catch(() => {})
    discoverPrinters().catch(() => {})
  }

  beforeDestroy () {
    this.stopPolling()
  }

  @Watch('open')
  onOpen (value: boolean) {
    if (!value) this.stopPolling()
  }

  rescan () {
    if (this.deleting) return
    discoveryState.cloudChecked = false
    discoverPrinters(true).catch(() => {})
  }

  /** Makes a printer show its link code, so that the person can read it and type it here. */
  async showCode (p: { key: string, name: string, cloud?: CloudNearbyPrinter, lan?: LanPrinter }) {
    if (this.deleting) return
    if (p.cloud) return this.askForCode(p.cloud.printerId, p.key, p.name)
    if (!p.lan) return
    this.error = null
    this.shown = ''
    this.asking = p.key
    try {
      const status = await showLanCode(p.lan.apiUrl)
      // Someone else may have started it, or linked it: say so, and let
      // the list show it too.
      p.lan.link = status
      const { note, error } = lanCodeOutcome(p.name, status)
      this.shown = note ?? ''
      this.error = error ?? null
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.asking = null
    }
  }

  async askForCode (printerId: string, key: string, name?: string) {
    if (this.deleting) return
    this.error = null
    this.asking = key
    try {
      await cloudApi.startLink(printerId)
      const shown = name ?? discoveryState.cloud.find(c => c.printerId === printerId)?.name ?? 'The printer'
      this.shown = `${shown} is showing a code on its screen now. Type it below.`
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.asking = null
    }
  }

  async claim (code: string) {
    if (this.deleting || this.busy || code.length !== 6) return
    this.error = null
    this.busy = true
    try {
      const claimed = await cloudApi.claim(code)
      this.claimed = { printer_id: claimed.printer_id, name: claimed.name }
      this.step = 'confirm'
      this.startPolling()
    } catch (error) {
      this.error = (error as Error).message
      refreshCloudNearby().catch(() => {})
    } finally {
      this.busy = false
    }
  }

  startPolling () {
    this.stopPolling()
    this.timer = window.setInterval(async () => {
      if (!this.claimed) return
      try {
        const { state } = await cloudApi.linkState(this.claimed.printer_id)
        if (state === 'linked') {
          this.stopPolling()
          await refreshPrinters()
          refreshLinkStates().catch(() => {})
          refreshCloudNearby().catch(() => {})
          this.step = 'done'
        } else if (state === 'declined' || state === 'expired') {
          this.stopPolling()
          this.error = state === 'declined'
            ? 'The link was declined on the printer.'
            : 'The code expired. Start again.'
          this.step = 'choose'
          this.code = ''
          refreshLinkStates().catch(() => {})
        }
      } catch { /* keep waiting */ }
    }, 1500)
  }

  stopPolling () {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  reset () {
    this.stopPolling()
    this.step = 'choose'
    this.code = ''
    this.claimed = null
  }

  async openPrinter () {
    const id = this.claimed?.printer_id
    this.open = false
    if (id) await activateCloudPrinter(id).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.muon-cloud-dialog {
  &__label {
    display: flex;
    align-items: center;
    min-height: 24px;
    margin-bottom: 6px;
    font-size: var(--m3d-text-2xs, 11px);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--m3d-text-muted);
  }

  &__scan {
    display: inline-flex;
    align-items: center;
    font-family: var(--m3d-font-mono);
    letter-spacing: 0;
    text-transform: none;
  }

  &__list {
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: transparent;
  }

  &__empty {
    padding: 12px;
    border: 1px dashed var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
  }
}

.muon-cloud-confirm {
  display: flex;
  gap: 16px;
  align-items: center;
}
</style>
