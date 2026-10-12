<template>
  <m3-dialog
    :value="open"
    eyebrow="Printers"
    title="Add a printer"
    :focus-title="false"
    max-width="500"
    content-class="add-printer"
    data-tid="add-printer-dialog"
    @close="open = false"
  >
    <nav
      class="aid__brands"
      aria-label="Printer brand"
    >
      <button
        v-for="brand in brandChoices"
        :key="brand.kind"
        type="button"
        class="aid__brand"
        :class="{ 'aid__brand--selected': selectedKind === brand.kind }"
        @click="selectBrand(brand.kind)"
      >
        {{ brand.label }}
        <small v-if="brand.via === 'm1'">needs an M1 on this network</small>
      </button>
    </nav>

    <section v-if="selectedKind === 'm1'">
      <p class="m3-dlg__text">
        Type the name on the printer's screen, or its IP address.
      </p>

      <form
        class="m3-field"
        autocomplete="off"
        @submit.prevent="submit"
      >
        <label
          class="m3-field__box m3-field__box--mono"
          :class="`m3-field__box--${tone}`"
        >
          <frame-icon
            name="search"
            small
          />
          <input
            ref="input"
            v-model="url"
            type="text"
            inputmode="url"
            autocapitalize="off"
            spellcheck="false"
            placeholder="muon-boxwood-367a.local"
            aria-label="The printer's name or IP address"
            data-tid="add-printer-address"
          >
        </label>
        <span class="m3-dlg__note">
          Such as <span class="aid__mono">muon-boxwood-367a.local</span> or <span class="aid__mono">192.168.1.20</span>
        </span>
      </form>

      <div
        v-if="status"
        class="aid__status"
        :class="`aid__status--${tone}`"
        role="status"
        aria-live="polite"
        data-tid="add-printer-status"
      >
        <span class="aid__status-icon">
          <v-progress-circular
            v-if="outcome === 'checking'"
            indeterminate
            size="16"
            width="2"
          />
          <frame-icon
            v-else
            :name="statusIcon"
            small
          />
        </span>
        <div class="aid__status-text">
          <b>{{ status.title }}</b>
          <span
            v-if="status.html"
            v-html="status.html"
          />
          <span v-else-if="status.detail">{{ status.detail }}</span>
        </div>
      </div>

      <section
        v-if="found.length || searching"
        class="aid__found"
        data-tid="add-printer-found"
      >
        <h3 class="aid__found-head">
          <frame-icon
            name="wifi"
            small
          />
          Found on this network
          <v-progress-circular
            v-if="searching"
            indeterminate
            size="11"
            width="2"
          />
        </h3>
        <button
          v-for="f in found"
          :key="f.key"
          type="button"
          class="aid__choice"
          :data-tid="`add-printer-found-${f.key}`"
          @click="pick(f)"
        >
          <printer-thumb :size="40" />
          <span class="aid__choice-text">
            <b>{{ f.name }}</b>
            <span>{{ f.detail }}</span>
          </span>
          <span class="aid__choice-go">Add</span>
        </button>
        <p
          v-if="!found.length"
          class="m3-dlg__note"
        >
          Looking for printers on this network…
        </p>
      </section>
    </section>

    <section
      v-else-if="selectedBrand?.via === 'm1'"
      class="aid__bridge"
    >
      <p>{{ selectedBrand.label }} needs an M1 bridge on this network.</p>
      <ol>
        <li
          v-for="step in selectedBrand.steps"
          :key="step"
        >
          {{ step }}
        </li>
      </ol>
      <a
        v-if="selectedBrand.docs"
        :href="selectedBrand.docs"
        target="_blank"
        rel="noopener"
      >Open the manufacturer's setup guide</a>
    </section>

    <section
      v-else-if="selectedBrand"
      class="aid__foreign"
    >
      <p
        v-if="mixedContentWarning"
        class="aid__warning"
      >
        Firefox and Safari block this page (https) from talking to a printer on plain http — that's mixed content. Chrome can reach printers on your network: open Fluidd in Chrome.
      </p>
      <p class="m3-dlg__text">
        {{ selectedBrand.label }} stays on this network and in this browser.
      </p>
      <label class="m3-field">
        <span class="m3-dlg__note">Printer address</span>
        <input
          v-model.trim="foreignHost"
          class="aid__input"
          placeholder="192.168.1.20"
          autocomplete="off"
        >
      </label>
      <label class="m3-field">
        <span class="m3-dlg__note">Name or model</span>
        <input
          v-model.trim="foreignModel"
          class="aid__input"
          :placeholder="selectedBrand.model || selectedBrand.label"
        >
      </label>
      <label class="m3-field">
        <span class="m3-dlg__note">Form factor</span>
        <select
          v-model="formFactor"
          class="aid__input"
        >
          <option value="enclosed">Enclosed</option>
          <option value="open-frame">Open frame</option>
          <option value="bed-slinger">Bed slinger</option>
        </select>
      </label>
      <label
        v-if="selectedKind === 'moonraker' || selectedKind === 'octoprint'"
        class="m3-field"
      >
        <span class="m3-dlg__note">API key (optional for Moonraker)</span>
        <input
          v-model="apiKey"
          class="aid__input"
          type="password"
          autocomplete="off"
        >
      </label>
      <label
        v-if="selectedKind === 'octoprint'"
        class="aid__steps"
      >
        <button
          type="button"
          class="btn"
          @click="askOctoPrintForKey"
        >Ask OctoPrint for a key</button>
        <span>{{ appKeyMessage }}</span>
      </label>
      <label class="aid__remember">
        <input
          v-model="rememberCredentials"
          type="checkbox"
        >
        Remember on this device
      </label>
      <p
        v-if="probeMessage"
        class="m3-dlg__note"
        role="status"
      >
        {{ probeMessage }}
      </p>
      <div
        v-if="selectedKind === 'moonraker'"
        class="aid__setup"
      >
        <p>Allow this browser in Moonraker:</p>
        <pre>[authorization]
cors_domains:
        {{ currentOrigin }}</pre>
        <button
          type="button"
          class="btn btn--sm"
          @click="copyMoonrakerSetup"
        >
          Copy
        </button>
        <p>Restart Moonraker.</p>
      </div>
      <p
        v-if="selectedBrand.steps.length"
        class="m3-dlg__note"
      >
        {{ selectedBrand.steps.join(' ') }}
      </p>
      <button
        type="button"
        class="btn"
        :disabled="probing || !foreignHost.trim()"
        @click="probeForeign"
      >
        {{ probing ? 'Checking…' : 'Check printer' }}
      </button>
    </section>

    <template #actions>
      <button
        v-if="selectedKind === 'm1'"
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="add-printer-cancel"
        @click="open = false"
      >
        Cancel
      </button>
      <button
        v-if="selectedKind === 'm1'"
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!verified"
        data-tid="add-printer-add"
        @click="addInstance"
      >
        {{ addLabel }}
      </button>
      <button
        v-else-if="selectedBrand?.via === 'direct'"
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!foreignVerified"
        @click="saveForeignPrinter"
      >
        Add printer
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'
import axios from 'axios'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import { consola } from 'consola'
import webSocketWrapper from '@/util/web-socket-wrapper'
import { escapeHtml, pageBlocksPrinter, printerPageUrl } from '@/util/page-blocks-printer'
import { discoveryState, instanceFor, pageBlocksLanIpv4, probeAddress, type LanPrinter } from '@/services/muon-cloud/discovery'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import { FOREIGN_BRANDS, foreignBrand } from '@/services/foreign-printers/brands'
import type { ForeignKind, FormFactor } from '@/services/foreign-printers/types'
import { lanFetch } from '@/services/muon-cloud/discovery'
import { blocksForeignHttp } from '@/util/browser-family'

/** A printer found on this network that isn't saved yet: one tap adds it. */
export interface FoundChoice {
  key: string;
  name: string;
  detail: string;
}

/**
 * What the check of a typed address found:
 * - `muon`: a Muon printer answered, and said who it is.
 * - `locked`: a printer answered, and wants a sign-in.
 * - `klipper`: a printer answered, but not a Muon one.
 * - `cors`: something answered, but won't let this page talk to it.
 * - `blocked`: this browser stopped the check before it left.
 * - `unreachable`: nothing answered.
 * - `not-printer`: something answered, but isn't a printer.
 */
export type AddOutcome = 'idle' | 'checking' | 'invalid' | 'muon' | 'locked' | 'klipper' | 'cors' | 'blocked' | 'unreachable' | 'not-printer'

/**
 * Add a printer: its name or IP address, checked before it's added, or one
 * found on this network in one tap. A Muon printer answers by IP address,
 * by its name (muon-boxwood-367a) and by its name with .local, and says who
 * it is; anything else is asked as Moonraker. What the check found is said
 * in plain words: found, wants a sign-in, not a Muon printer, nothing there,
 * or the browser blocked it.
 */
@Component({ components: { M3Dialog, PrinterThumb } })
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  /** Printers found on this network and not saved yet (the Printers page passes them). */
  @Prop({ type: Array, default: () => [] })
  readonly found!: FoundChoice[]

  /** The network is still being searched. */
  @Prop({ type: Boolean })
  readonly searching!: boolean

  valid = true
  verifying = false
  verified = false
  outcome: AddOutcome = 'idle'
  /** What failed, as the browser said it. */
  error: string | null = null
  /** A note with a way round (a link), its values escaped. */
  note: string | null = null
  /** The Muon3D printer that answered for what was typed, by IP address or by name. */
  resolved: LanPrinter | null = null
  url = ''
  selectedKind: ForeignKind | 'm1' = 'm1'
  foreignHost = ''
  foreignModel = ''
  formFactor: FormFactor = 'bed-slinger'
  apiKey = ''
  rememberCredentials = false
  probing = false
  foreignVerified = false
  probeMessage = ''
  appKeyMessage = ''
  appKeyToken = ''

  abortController?: AbortController = undefined

  mounted () {
    this.$nextTick(() => (this.$refs.input as HTMLInputElement | undefined)?.focus())
  }

  get brandChoices () {
    return [{ kind: 'm1' as const, label: 'Muon3D M1', via: 'direct' as const }, ...FOREIGN_BRANDS]
  }

  get selectedBrand () {
    return this.selectedKind === 'm1' ? null : foreignBrand(this.selectedKind)
  }

  get mixedContentWarning () {
    return blocksForeignHttp() && pageBlocksPrinter(`http://${this.foreignHost}`)
  }

  get currentOrigin () { return location.origin }

  selectBrand (kind: ForeignKind | 'm1') {
    this.selectedKind = kind
    this.foreignVerified = false
    this.probeMessage = ''
    if (kind !== 'm1') {
      const brand = foreignBrand(kind)
      this.foreignModel = brand.model ?? ''
      this.formFactor = brand.formFactor
    }
  }

  async probeForeign () {
    if (!this.selectedBrand || this.selectedBrand.via !== 'direct') return
    this.probing = true
    this.foreignVerified = false
    this.probeMessage = ''
    const host = this.foreignHost.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    const timeout = (promise: Promise<any>) => Promise.race([
      promise,
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Check timed out')), 5000))
    ])
    try {
      if (this.selectedKind === 'moonraker') {
        const response = await timeout(lanFetch(`http://${host}/server/info`, { cache: 'no-store' }))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        await response.json()
      } else if (this.selectedKind === 'octoprint') {
        const headers = this.apiKey ? { 'X-Api-Key': this.apiKey } : undefined
        const response = await timeout(lanFetch(`http://${host}/api/version`, { headers, cache: 'no-store' }))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        await response.json()
      } else {
        await timeout(new Promise<void>((resolve, reject) => {
          const creality = this.selectedKind === 'creality'
          const socket = new WebSocket(creality ? `ws://${host}:9999` : `ws://${host}:3030/websocket`, creality ? 'wsslicer' : undefined)
          const timer = setTimeout(() => { socket.close(); reject(new Error('Check timed out')) }, 5000)
          socket.onopen = () => {
            if (!creality) socket.send(JSON.stringify({ Id: '', Data: { Cmd: 1, Data: {}, RequestID: crypto.randomUUID().replace(/-/g, ''), MainboardID: '', TimeStamp: Math.floor(Date.now() / 1000), From: 1 }, Topic: 'sdcp/request/' }))
          }
          socket.onmessage = event => {
            if (!creality) {
              try { if (!JSON.parse(event.data).MainboardID) return } catch { return }
            }
            clearTimeout(timer)
            socket.close()
            resolve()
          }
          socket.onerror = () => { clearTimeout(timer); reject(new Error('Could not reach the printer')) }
        }))
      }
      this.foreignHost = host
      this.foreignVerified = true
      this.probeMessage = 'Printer found.'
    } catch (error) {
      this.probeMessage = error instanceof Error ? error.message : 'Could not reach the printer.'
    } finally {
      this.probing = false
    }
  }

  async askOctoPrintForKey () {
    const host = this.foreignHost.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    try {
      const probe = await lanFetch(`http://${host}/plugin/appkeys/probe`)
      if (probe.status === 404) { this.appKeyMessage = 'App keys are not available here. Enter an API key above.'; return }
      const request = await lanFetch(`http://${host}/plugin/appkeys/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: 'Muon3D Fluidd' })
      })
      if (request.status !== 201) throw new Error(`HTTP ${request.status}`)
      const body = await request.json()
      this.appKeyToken = body.app_token
      this.appKeyMessage = 'Approve in OctoPrint.'
      this.pollOctoPrintKey(host).catch(() => {
        this.appKeyMessage = 'The key request was denied or timed out.'
      })
    } catch (error) {
      this.appKeyMessage = error instanceof Error ? error.message : 'Could not request an API key.'
    }
  }

  async pollOctoPrintKey (host: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const response = await lanFetch(`http://${host}/plugin/appkeys/request/${encodeURIComponent(this.appKeyToken)}`)
      if (response.status === 202) continue
      if (response.status === 200) {
        const body = await response.json()
        this.apiKey = body.api_key
        this.appKeyMessage = 'API key approved.'
        return
      }
      this.appKeyMessage = 'The key request was denied or timed out.'
      return
    }
    this.appKeyMessage = 'The key request was denied or timed out.'
  }

  async copyMoonrakerSetup () {
    await navigator.clipboard?.writeText(`[authorization]\ncors_domains:\n  ${location.origin}`)
  }

  async saveForeignPrinter () {
    if (!this.selectedBrand || !this.foreignVerified) return
    const { saveForeign } = await import('@/services/foreign-printers/store')
    await saveForeign({
      kind: this.selectedKind as ForeignKind,
      name: this.foreignModel || this.selectedBrand.label,
      model: this.foreignModel || undefined,
      host: this.foreignHost,
      via: 'direct',
      formFactor: this.formFactor
    }, this.apiKey ? { apiKey: this.apiKey } : null, { remember: this.rememberCredentials })
    const live = await import('@/services/foreign-printers/live')
    await live.refreshForeign()
    await live.connectAll()
    this.open = false
    this.$emit('saved')
  }

  /**
   * Validates a URL
   */
  validUrl (url: string) {
    try {
      this.$filters.getApiUrls(url)
    } catch {
      return false
    }
    return true
  }

  get hosted () {
    return this.$store.state.config.hostConfig.hosted
  }

  /** What was typed, without a scheme or a trailing slash, for the status line. */
  get typed (): string {
    return this.url.trim().replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '')
  }

  get tone (): 'ok' | 'warn' | 'err' | 'off' {
    switch (this.outcome) {
      case 'muon': return 'ok'
      case 'locked':
      case 'klipper':
      case 'blocked': return 'warn'
      case 'cors':
      case 'unreachable':
      case 'not-printer':
      case 'invalid': return 'err'
      default: return 'off'
    }
  }

  get statusIcon (): string {
    switch (this.outcome) {
      case 'muon': return 'check'
      case 'locked': return 'lock'
      default: return 'alert'
    }
  }

  get status (): { title: string, detail?: string, html?: string } | null {
    const name = this.resolved?.name
    switch (this.outcome) {
      case 'checking':
        return { title: `Looking for ${this.typed}…` }
      case 'invalid':
        return { title: "That isn't an address", detail: 'Type a name such as muon-boxwood-367a.local, or an IP address such as 192.168.1.20.' }
      case 'muon':
        return { title: `Found ${name}`, detail: `At ${this.resolved?.host}. Add it to see it here with your other printers.` }
      case 'locked':
        return { title: `${name ?? 'This printer'} wants you to sign in`, detail: 'Add it, then sign in on its page.' }
      case 'klipper':
        return { title: "A printer answered, but it isn't a Muon printer", detail: "You can still add it. The parts of this page made for Muon printers won't work with it." }
      case 'cors':
        return { title: "It answered, but won't let this page in", html: this.note ?? undefined }
      case 'blocked':
        return { title: "This browser didn't let the check through", html: this.note ?? undefined }
      case 'unreachable':
        return {
          title: `Nothing answered at ${this.typed}`,
          detail: "Check the printer is switched on, that it's on the same network as this device, and that the address matches the one on its screen."
        }
      case 'not-printer':
        return { title: "Something answered, but it isn't a printer", detail: "Check the address matches the one on the printer's screen." }
      default:
        return null
    }
  }

  get addLabel (): string {
    if ((this.outcome === 'muon' || this.outcome === 'locked') && this.resolved) return `Add ${this.resolved.name}`
    return 'Add printer'
  }

  // Watch for url changes. Validity is checked after the debounce: a pasted
  // address used to read as invalid here and was never checked.
  @Watch('url')
  onUrlChange (value: string, oldVal: string) {
    if (value === oldVal) return
    this.abortController?.abort()
    this.verified = false
    this.resolved = null
    this.error = null
    this.note = null
    this.outcome = value.trim() ? 'checking' : 'idle'
    this.verifying = !!value.trim()
    this.handleUrlChange(value)
  }

  @Debounce(750)
  async handleUrlChange (value: string) {
    if (value !== this.url || !value.trim()) return
    this.valid = this.validUrl(value)
    if (!this.valid) {
      this.verifying = false
      this.outcome = 'invalid'
      return
    }

    this.verified = false
    this.error = null
    this.note = null
    this.verifying = true
    this.outcome = 'checking'
    this.resolved = null

    // A Muon3D printer first: it answers by IP address, by its name
    // (muon-boxwood-367a) and by its name with .local, and says who it is.
    const printer = await probeAddress(value)
    if (value !== this.url) return
    if (printer) {
      this.resolved = printer
      this.verified = true
      this.verifying = false
      this.outcome = printer.health?.state === 'locked' ? 'locked' : 'muon'
      return
    }

    const { apiUrl, socketUrl } = this.$filters.getApiUrls(value)

    // Handle cancelling axios requests.
    this.abortController?.abort()

    this.abortController = new AbortController()

    const { signal } = this.abortController

    // Start by making a standard request. Maybe it's good?
    // A plain request on the network, never Vue.$httpClient: while a cloud
    // printer is shown, that client travels over Iroh, so the cloud printer
    // would answer for any address typed here. It also carries the current
    // printer's sign-in, which is not this address's to see.
    const request = await axios.get(`${apiUrl}/server/info?t=${Date.now()}`, {
      timeout: Globals.NETWORK_REQUEST_TIMEOUT,
      signal
    })
      .then(() => {
        this.verified = true
        this.verifying = false
        this.outcome = 'klipper'
        return 'ok'
      })
      .catch(e => {
        // Cancelled: a newer address is being checked.
        if (axios.isCancel(e)) {
          return 'ok'
        } else if (axios.isAxiosError(e)) {
          // A 401: a printer, wanting a sign-in.
          if (e.response?.status === 401) {
            this.verified = true
            this.verifying = false
            this.outcome = 'locked'
            return 'ok'
          }

          // If it failed with a network issue..
          if (e.request && !e.response) return e.message
        }

        // Something answered, but not as a printer does.
        this.error = e instanceof Error ? e.message : String(e)
        this.verifying = false
        this.outcome = 'not-printer'
        return 'ok'
      })

    if (value !== this.url) return

    // The initial request failed with a network issue..
    if (request !== 'ok') {
      if (this.hosted) {
        await webSocketWrapper(socketUrl, signal)
          .then(() => {
            // likely a cors issue, but socket worked
            if (value !== this.url) return
            this.verified = true
            this.outcome = 'klipper'
          })
          .catch(e => {
            // external host not reachable (fetch returns 'failed to fetch')
            consola.debug('Network Error', e, request)
            return this.onUnreachable(apiUrl, request)
          })
          .finally(() => { if (value === this.url) this.verifying = false })
      } else {
        await fetch(`${apiUrl}/server/info`, { signal, mode: 'no-cors', cache: 'no-cache' })
          .then(() => {
            // likely a cors issue
            if (value !== this.url) return
            this.error = this.$t('app.endpoint.error.cors_error').toString()
            this.note = this.$t('app.endpoint.error.cors_note', {
              url: Globals.DOCS_MULTIPLE_INSTANCES
            }).toString()
            this.outcome = 'cors'
          })
          .catch(e => {
            // external host not reachable (fetch returns 'failed to fetch')
            consola.debug('Network Error', e, request)
            return this.onUnreachable(apiUrl, request)
          })
          .finally(() => { if (value === this.url) this.verifying = false })
      }
    }
  }

  /**
   * An address this page could not reach at all. From app.muon3d.com (HTTPS)
   * to a plain-HTTP printer that is usually the browser blocking mixed
   * content, not a wrong address, so say so and link the printer's own page
   * rather than asking whether the address is correct.
   */
  async onUnreachable (apiUrl: string, request: string) {
    const typed = this.url
    const blocked = /^http:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?\/?$/.test(apiUrl) && await pageBlocksLanIpv4()
    // The first check can take seconds. If the address changed meanwhile,
    // this answer is about one nobody is looking at any more.
    if (this.url !== typed) return
    this.verifying = false
    if (blocked) {
      const ownUrl = discoveryState.blockedByPage?.ownUrl
      this.error = null
      this.note = this.$t('app.endpoint.error.blocked_ip_from_name', { host: escapeHtml(location.host) }) +
        (ownUrl ? ' ' + this.$t('app.endpoint.error.blocked_ip_from_name_way_round', { url: escapeHtml(ownUrl) }) : '')
      this.outcome = 'blocked'
      return
    }
    if (pageBlocksPrinter(apiUrl)) {
      this.error = null
      this.note = this.$t('app.endpoint.error.blocked_by_page', {
        host: escapeHtml(location.host),
        url: escapeHtml(printerPageUrl(apiUrl))
      }).toString()
      this.outcome = 'blocked'
      return
    }
    this.error = request
    this.note = null
    this.outcome = 'unreachable'
  }

  submit () {
    if (this.verified) this.addInstance()
  }

  addInstance () {
    if (!this.verified) return
    const apiConfig = this.resolved ? instanceFor(this.resolved) : this.$filters.getApiUrls(this.url)
    this.open = false
    this.$emit('resolve', apiConfig)
  }

  /** One found on this network: the page opens it, as its own card would. */
  pick (choice: FoundChoice) {
    this.open = false
    this.$emit('pick', choice.key)
  }
}
</script>

<style lang="scss" scoped>
  .aid__brands {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 16px;
  }

  .aid__brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 9px 11px;
    border: 1px solid var(--m3d-border);
    border-radius: 12px;
    color: var(--m3d-text);
    text-align: left;
  }

  .aid__brand--selected {
    border-color: var(--m3d-accent);
  }

  .aid__brand small,
  .aid__bridge,
  .aid__steps,
  .aid__warning {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .aid__input {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .aid__foreign,
  .aid__bridge {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .aid__foreign .m3-field {
    gap: 5px;
  }

  .aid__remember {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .aid__setup {
    padding: 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
  }

  .aid__setup pre {
    white-space: pre-wrap;
  }

  .aid__warning {
    color: var(--m3d-warning);
  }

  .aid__mono {
    font-family: var(--m3d-font-mono);
  }

  .aid__status {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .aid__status-icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
  }

  .aid__status--ok .aid__status-icon {
    background: color-mix(in srgb, var(--m3d-success) 18%, transparent);
    color: var(--m3d-success);
  }

  .aid__status--warn .aid__status-icon {
    background: color-mix(in srgb, var(--m3d-warning) 18%, transparent);
    color: var(--m3d-warning);
  }

  .aid__status--err .aid__status-icon {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger);
  }

  .aid__status-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding-top: 4px;
    overflow-wrap: anywhere;

    b {
      font-size: 14px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .aid__found {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
  }

  .aid__found-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 2px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .aid__choice {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 10px 8px 8px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    text-align: left;
    cursor: pointer;

    &:hover {
      filter: brightness(1.1);
    }
  }

  .aid__choice-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      overflow: hidden;
      color: var(--m3d-text-muted);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .aid__choice-go {
    flex: none;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
    font-size: 13px;
    font-weight: 600;
  }
</style>
