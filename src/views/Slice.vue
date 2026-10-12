<template>
  <div
    class="slice-view"
    :class="{ 'slice-view--part': partOfPage }"
    data-test="slice-view"
  >
    <iframe
      v-if="url && present === 'present'"
      ref="frame"
      class="slice-view__frame"
      title="Muon3D Slicer"
      allow="clipboard-write; fullscreen"
      referrerpolicy="no-referrer"
      :sandbox="sandbox"
    />
    <v-alert
      v-else-if="!url || present === 'absent'"
      type="warning"
      text
    >
      {{ $t('app.slicer.msg.no_slicer') }}
    </v-alert>

    <print-confirm-dialog
      :request="dialogRequest"
      @answer="handleAnswer"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { watch } from 'vue'
import type { Route, NavigationGuardNext } from 'vue-router'
import { consola } from 'consola'
import BrowserMixin from '@/mixins/browser'
import ControlMixin from '@/mixins/control'
import { proMode } from '@/services/pro-mode'
import { readLook } from '@/services/slicer-bridge/look'
import { hostSetup, type ActiveSpool } from '@/services/slicer-bridge/setup'
import type { HostSetup } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'
import PrintConfirmDialog, { type PrintConfirmRequest } from '@/components/slicer/PrintConfirmDialog.vue'
import { startSlicerHost, type SlicerHost } from '@/services/slicer-bridge/host'
import { readFluiddSelection } from '@/services/slicer-bridge/fluidd'
import { configuredSlicerUrl, probeSlicer, slicerPresence, type SlicerPresence } from '@/services/slicer-bridge/slicerUrl'
import { isBoundToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import type { ConfirmAnswer, ConfirmRequest } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import { printerError } from '@/services/slicer-bridge/vendor/printer-client/errors/kinds'

interface OpenDialog {
  request: ConfirmRequest;
  resolve: (answer: ConfirmAnswer) => void;
  reject: (error: unknown) => void;
}

/**
 * The frame's sandbox when the slicer is on another origin (a hosted Fluidd),
 * which may be hostile: everything the slicer uses, but never a navigation of
 * this page (no allow-top-navigation). On this page's own origin (a printer's
 * copy) a sandbox would add nothing, so there is none.
 */
export const CROSS_ORIGIN_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox'

/**
 * Fluidd › Slice: the Muon3D Slicer in a frame (its embed.html, from
 * VUE_MUON_SLICER_URL, framed only once probeSlicer found it there), hosted
 * over printer-bridge/1
 * (services/slicer-bridge/host.ts). The slicer slices for the printer
 * Fluidd has selected and sends to it through Fluidd's own connection; a
 * print starts only from Fluidd's dialog (PrintConfirmDialog.vue).
 *
 * The frame stays while Fluidd switches printer: the slicer is told of the
 * new printer and keeps its plates. Leaving /slice with changes the slicer
 * has not saved asks first.
 *
 * The Fluidd integration (KAN-511, muon3d-slicer docs/fluidd-integration.md):
 * the slicer is told Fluidd's look, its Simple or Pro, and what the selected
 * printer has loaded, each again when it changes. A slicer that draws itself
 * as a part of the page (its hello lists ui.look) gets a frame with no card
 * of its own; an older one keeps today's framed card. The rail stays either
 * way.
 */
@Component({
  components: {
    PrintConfirmDialog
  }
})
export default class Slice extends Mixins(ControlMixin, BrowserMixin) {
  host: SlicerHost | null = null
  /** The slicer draws itself as a part of the page (its hello listed ui.look). */
  partOfPage = false
  styleObserver: MutationObserver | null = null
  setupFrame = 0
  dialog: OpenDialog | null = null
  dirty = false
  closed = false
  stopWatching: (() => void) | null = null

  get url (): URL | null {
    return configuredSlicerUrl()
  }

  get present (): SlicerPresence {
    return slicerPresence.state
  }

  get sandbox (): string | undefined {
    const url = this.url
    return url && url.origin !== window.location.origin ? CROSS_ORIGIN_SANDBOX : undefined
  }

  get theme (): 'light' | 'dark' {
    return this.$vuetify.theme.dark ? 'dark' : 'light'
  }

  get density (): 'compact' | 'touch' {
    return this.isMobileViewport ? 'touch' : 'compact'
  }

  /** What changes Fluidd's look: the theme, its colour, and the page style (flat or glass). */
  get lookKey (): string {
    const themes = this.$vuetify.theme.themes as Record<string, Record<string, unknown>> | undefined
    return `${this.theme}|${String(themes?.[this.theme]?.primary ?? '')}`
  }

  readLook () {
    const root = (document.querySelector('.v-application') as HTMLElement | null) ?? document.documentElement
    return readLook(root, this.theme)
  }

  /**
   * What the selected printer has loaded, and the material table
   * (setup.ts). Nothing Fluidd can't read yet stops the slicer: it gets no
   * material, and the next change sends it again.
   */
  get currentSetup (): HostSetup {
    try {
      const spool = this.$store.getters['spoolman/getActiveSpool'] as ActiveSpool | null | undefined
      const heated = this.material ? this.materialChoices.find(c => c.presetId === this.material?.id) ?? null : null
      return hostSetup({ spool: spool ?? null, loaded: this.loadedMaterial, heated, choices: this.materialChoices })
    } catch {
      return { material: null, materials: [] }
    }
  }

  get dialogRequest (): PrintConfirmRequest | null {
    const request = this.dialog?.request
    if (!request) return null
    return { printer: request.printer.name, paths: request.paths, mode: request.mode, plateClear: request.plateClear }
  }

  async mounted () {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    if (!await probeSlicer(this.url)) return
    await this.$nextTick()
    this.startHost()
  }

  startHost () {
    const url = this.url
    const frame = this.$refs.frame as HTMLIFrameElement | undefined
    if (!url || !frame || this.host || this.closed) return
    this.host = startSlicerHost({
      frame,
      slicerUrl: url,
      store: this.$store,
      http: this.$httpClient,
      selection: () => readFluiddSelection(this.$store),
      remote: () => isBoundToPrinterTransport(this.$httpClient),
      fetchIdentity: this.identityFetcher(),
      confirm: (request) => this.confirm(request),
      theme: this.theme,
      density: this.density,
      look: this.readLook(),
      mode: proMode.on ? 'pro' : 'simple',
      setup: (key) => (key === this.host?.printer()?.key ? this.currentSetup : null),
      hostVersion: String(import.meta.env.VERSION ?? ''),
      onState: (state) => { this.dirty = state.dirty === true },
      log: (entry) => consola.debug('[slicer bridge]', entry)
    })
    // Synchronous: the frame hears of a new printer before anything else about it.
    this.stopWatching = watch(
      () => JSON.stringify(readFluiddSelection(this.$store)),
      () => this.host?.refresh(),
      { flush: 'sync' }
    )
    // The look is read a frame after a change, once the new classes apply. setLook sends ui.theme too.
    const sendLook = () => requestAnimationFrame(() => this.host?.bridge.setLook(this.readLook()))
    this.$watch('lookKey', sendLook)
    this.styleObserver = new MutationObserver(sendLook)
    this.styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-m3d-style'] })
    this.$watch('density', (density: 'compact' | 'touch') => this.host?.bridge.setDensity(density))
    this.$watch(() => proMode.on, (on: boolean) => this.host?.bridge.setMode(on ? 'pro' : 'simple'))
    // One printer.setup a frame, however many of its inputs change at once.
    this.$watch(() => JSON.stringify(this.currentSetup), () => {
      cancelAnimationFrame(this.setupFrame)
      this.setupFrame = requestAnimationFrame(() => this.host?.bridge.setupChanged())
    })
    this.watchFeatures()
  }

  /** Once the slicer's hello is welcomed, whether it draws itself as a part of the page. */
  watchFeatures (tries = 120) {
    if (this.closed || !this.host) return
    const features = this.host.bridge.clientFeatures
    if (features.length || tries <= 0) {
      this.partOfPage = features.includes('ui.look')
      return
    }
    setTimeout(() => this.watchFeatures(tries - 1), 250)
  }

  beforeDestroy () {
    this.closed = true
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.stopWatching?.()
    this.styleObserver?.disconnect()
    cancelAnimationFrame(this.setupFrame)
    this.dialog?.reject(new Error('The slicer closed'))
    this.dialog = null
    this.host?.close()
    this.host = null
  }

  async beforeRouteLeave (to: Route, from: Route, next: NavigationGuardNext) {
    if (!this.dirty) return next()
    const leave = await this.$confirm(
      this.$tc('app.slicer.msg.leave'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
    if (leave === true) next()
    else next(false)
  }

  handleBeforeUnload (event: BeforeUnloadEvent) {
    if (!this.dirty) return
    event.preventDefault()
    event.returnValue = ''
  }

  /**
   * Asks the network printer at an API address its identity through Fluidd's
   * own client, so with its sign-in, and reads every status here: a refusal
   * shows no toast and never signs Fluidd out.
   */
  identityFetcher () {
    return (apiUrl: string): Promise<unknown> =>
      this.$httpClient.get('/server/muon/identity', { baseURL: apiUrl, responseType: 'json', validateStatus: () => true })
        .then(r => r.status === 200 ? r.data : Promise.reject(new Error(String(r.status))))
  }

  /** Fluidd's dialog for one print.request; one at a time. */
  confirm (request: ConfirmRequest): Promise<ConfirmAnswer> {
    if (this.dialog) return Promise.reject(printerError('busy', 'Another print is waiting for its confirmation'))
    if (request.signal.aborted) return Promise.reject(new Error('The request ended'))
    return new Promise<ConfirmAnswer>((resolve, reject) => {
      const open: OpenDialog = { request, resolve, reject }
      const onAbort = () => {
        if (this.dialog !== open) return
        this.dialog = null
        reject(new Error('The request ended'))
      }
      request.signal.addEventListener('abort', onAbort, { once: true })
      this.dialog = open
    })
  }

  handleAnswer (answer: ConfirmAnswer) {
    const open = this.dialog
    if (!open) return
    this.dialog = null
    open.resolve(answer)
  }
}
</script>

<style lang="scss" scoped>
  .slice-view {
    position: relative;
    height: calc(100vh - 56px - 32px);
    height: calc(100dvh - 56px - 32px);
    min-height: 360px;
  }

  .slice-view__frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 12px;
    background: var(--v-background-base, transparent);
  }

  // A slicer drawn as a part of the page: no card of its own, the page's own ground.
  .slice-view--part .slice-view__frame {
    border-radius: 0;
    background: transparent;
  }
</style>
