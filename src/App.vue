<template>
  <v-app v-if="!routerReady || blankedForLanguage" />
  <v-app
    v-else
    class="fluidd muon-shell"
    :class="{
      'no-pointer-events': dragState,
      'muon-shell--tabbed': showTabBar,
      'muon-shell--rail': showRail
    }"
    :style="showRail ? { '--muon-rail-width': `${railWidth}px` } : undefined"
  >
    <app-rail v-if="showRail" />

    <inline-svg
      v-if="!managedConsoleRoute && showBackgroundLogo && !isMobileViewport"
      :src="logoSrc"
      class="muon-background-logo"
    />

    <app-bar v-if="!managedConsoleRoute" />

    <flash-message
      v-if="!managedConsoleRoute && flashMessageState"
      v-model="flashMessageState.open"
      :text="flashMessageState.text"
      :type="flashMessageState.type"
      :timeout="flashMessageState.timeout"
    />

    <app-tab-bar v-if="showTabBar" />

    <v-main
      class="muon-main"
      :style="customBackgroundImageStyle"
    >
      <!-- <pre>authenticated {{ authenticated }}, socketConnected {{ socketConnected }}, apiConnected {{ apiConnected }}</pre> -->
      <v-container
        fluid
        :class="{
          'fill-height': $route.meta?.fillHeight ?? false,
          [['single', 'double', 'triple', 'quad'][columnCount - 1]]: true
        }"
        class="constrained-width muon-content pa-2 pa-sm-4"
      >
        <app-page-title
          v-if="showPageHeader"
          :class="{ 'muon-stale': connection.stale }"
        />

        <connection-banner
          v-if="connection.banner"
          :kind="connection.banner"
        />

        <update-banner v-if="showUpdateBanner" />

        <printer-opening
          v-if="otherPrinterRoute"
          :slug="$route.params.printer"
        />

        <router-view
          v-else-if="connection.page"
          :class="{ 'muon-stale': connection.stale }"
          :aria-busy="connection.stale ? 'true' : undefined"
        />

        <register-service-worker />
      </v-container>

      <updating-screen
        v-if="connection.screen === 'updating' || connection.screen === 'updating-late'"
        :offline-state="connection.screen"
        :printer-name="displayName"
      />
      <connecting-screen
        v-else-if="connection.screen"
        :state="connection.screen"
      />

      <template v-if="!managedConsoleRoute">
        <keyboard-shortcuts-dialog />
        <command-bar />
      </template>
      <template v-if="!managedConsoleRoute && !foreignPrinterRoute">
        <file-system-download-dialog />
        <updating-dialog />
        <spool-selection-dialog />
        <action-command-prompt-dialog />
        <job-ready-dialog />
      </template>
    </v-main>

    <app-footer v-if="!managedConsoleRoute && !foreignPrinterRoute" />

    <app-drag-overlay
      v-if="!managedConsoleRoute"
      v-model="dragState"
      :message="$t('app.file_system.overlay.drag_files_folders_upload')"
      icon="$fileUpload"
    />
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { EventBus } from '@/eventBus'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import type { LinkPropertyHref, MetaPropertyName } from 'vue-meta'
import FileSystemDownloadDialog from '@/components/widgets/filesystem/FileSystemDownloadDialog.vue'
import SpoolSelectionDialog from '@/components/widgets/spoolman/SpoolSelectionDialog.vue'
import type { FlashMessage } from '@/types'
import { getFilesFromDataTransfer, hasFilesInDataTransfer } from './util/file-system-entry'
import type { ThemeConfig } from '@/store/config/types'
import ActionCommandPromptDialog from './components/common/ActionCommandPromptDialog.vue'
import KeyboardShortcutsDialog from './components/common/KeyboardShortcutsDialog.vue'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from './util/event-helpers'
import { isManagedConsolePath } from '@/router/managedPath'
import {
  activeSlug,
  foreignRecordForSlug,
  isActiveSlug,
  isForeignSlug,
  printerPageNeedsLogin,
  samePageFor,
  stepPrinter
} from '@/services/printer-pages'
import PrinterOpening from './components/muon-cloud/PrinterOpening.vue'
import ConnectionBanner from './components/layout/ConnectionBanner.vue'
import ConnectingScreen from './components/layout/ConnectingScreen.vue'
import UpdatingScreen from './components/updates/UpdatingScreen.vue'
import UpdateBanner from './components/updates/UpdateBanner.vue'
import { printerLost, updateWatch, watchUpdates } from '@/services/updates/watch'
import { prebuild as prebuildLiveM1 } from '@/services/m1-3d/parked'
import { ACTIVE_PHASES, offlineScreen } from '@/services/updates/model'
import { printerNameParts } from '@/util/printer-name'
import { connectionView, type ConnectionView } from '@/services/connection/view'
import FrameMixin from '@/mixins/frame'
import { ALL_PRINTERS_KEY, PAGE_KEYS, sectionForKey } from '@/router/printerSections'
import { scopedPath } from '@/router/printerPagePaths'
import { setProMode } from '@/services/pro-mode'
import { GoKeys } from '@/util/go-keys'
import { isGcodeFile, isModelFile } from '@/services/jobs/model'
import JobReadyDialog from './components/jobs/JobReadyDialog.vue'

@Component<App>({
  metaInfo () {
    return {
      title: this.pageTitle,
      link: this.pageIcon,
      meta: this.pageMeta
    }
  },
  components: {
    ConnectionBanner,
    ConnectingScreen,
    UpdatingScreen,
    UpdateBanner,
    PrinterOpening,
    JobReadyDialog,
    SpoolSelectionDialog,
    FileSystemDownloadDialog,
    ActionCommandPromptDialog,
    KeyboardShortcutsDialog
  }
})
export default class App extends Mixins(StateMixin, FrameMixin, FilesMixin, BrowserMixin) {
  dragState = false
  customBackgroundImageStyle: Record<string, string> = {}
  goKeys = new GoKeys()

  flashMessageState: FlashMessage = {
    open: false,
    text: undefined,
    type: undefined
  }

  // Until the first navigation resolves, $route is still /. A lazy route such
  // as /setup would otherwise mount the whole shell for a moment, and the
  // printer switcher in it starts a network search the setup page must never
  // make (it may reach only the printer).
  routerReady = false

  created () {
    const ready = () => { this.routerReady = true }
    this.$router.onReady(ready, ready)
  }

  get theme (): ThemeConfig {
    return this.$store.state.config.uiSettings.theme as ThemeConfig
  }

  get showBackgroundLogo () {
    return this.theme.backgroundLogo
  }

  get logoSrc () {
    return `${import.meta.env.BASE_URL}${this.theme.logo.src}`
  }

  get primaryColor (): string {
    return this.$vuetify.theme.currentTheme.primary?.toString() ?? ''
  }

  get primaryOffsetColor (): string {
    return this.$vuetify.theme.currentTheme['primary-offset']?.toString() ?? ''
  }

  // Our app is in a loading state when the socket isn't quite ready, or
  // our translations are loading.
  get updating () {
    return this.$store.state.version.busy
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  /**
   * A page for a printer Fluidd isn't on (yet): it shows that printer opening,
   * never the last printer's page under this printer's address.
   */
  get otherPrinterRoute (): boolean {
    const slug = this.$route.params.printer
    return !!slug && !this.printerIndependentRoute && !isForeignSlug(slug) && !isActiveSlug(slug)
  }

  get foreignPrinterRoute (): boolean {
    return isForeignSlug(this.$route.params.printer)
  }

  get printerIndependentRoute (): boolean {
    return this.$route.meta?.printerIndependent === true
  }

  /** A printer opened by its address asks for its own login once it is on (printerPageNeedsLogin). */
  get needsLogin (): boolean {
    return printerPageNeedsLogin({
      apiConnected: this.apiConnected,
      authenticated: this.authenticated,
      routePrinter: this.$route.params.printer,
      routeName: this.$route.name,
      printerIndependent: this.printerIndependentRoute
    })
  }

  @Watch('needsLogin')
  onNeedsLogin (needs: boolean) {
    if (needs) this.$router.replace('/login').catch(() => {})
  }

  /** The printer has said nothing for a few seconds; the page stays up while Fluidd waits. */
  get socketStalled (): boolean {
    return this.$store.state.socket.stalled && this.$store.state.socket.open
  }

  /** Fluidd has reached the printer it is on since it was chosen, so a drop keeps the page. */
  wasConnected = false

  @Watch('socketConnected', { immediate: true })
  onSocketConnected (connected: boolean) {
    if (connected) this.wasConnected = true
    // The printer's own update: watched while connected, and a drop mid-install is remembered.
    if (connected && this.printerFrame) {
      watchUpdates(activeSlug() ?? String(this.$store.state.config.apiUrl ?? ''), url => this.$httpClient.get(url, { validateStatus: () => true }))
    } else if (!connected && this.wasConnected) {
      printerLost()
    }
  }

  get displayName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  /** The bar over every page while the printer installs an update, but on the Updating page itself. */
  get showUpdateBanner (): boolean {
    if (this.foreignPrinterRoute) return false
    const r = updateWatch.remembered
    return !!r && ACTIVE_PHASES.includes(r.phase) && this.printerFrame && this.socketConnected &&
      this.$route.name !== 'Updating' && updateWatch.printer === (activeSlug() ?? '')
  }

  /** Another printer: nothing has been reached yet. */
  /** Opening a printer's overview, the live M1 is built while the printer connects, not after. */
  @Watch('$route.name', { immediate: true })
  onRouteName (name: string | null | undefined) {
    if (name === 'Dashboard' && !this.foreignPrinterRoute) prebuildLiveM1()
  }

  @Watch('$store.state.config.apiUrl')
  onPrinterChanged () {
    this.wasConnected = this.socketConnected
  }

  /** What the connection shows: the page, a bar over it, or a screen of its own (services/connection/view). */
  get connection (): ConnectionView {
    if (this.foreignPrinterRoute) return { page: true, stale: false, banner: null, screen: null }
    return connectionView({
      socketConnected: this.socketConnected,
      apiConnected: this.apiConnected,
      authenticated: this.authenticated,
      socketConnecting: this.socketConnecting,
      wasConnected: this.wasConnected,
      stalled: this.socketStalled,
      printerIndependent: this.managedConsoleRoute || this.printerIndependentRoute,
      otherPrinter: this.otherPrinterRoute,
      updating: !this.socketConnected && updateWatch.printer === (activeSlug() ?? '')
        ? offlineScreen(updateWatch.remembered, updateWatch.now)
        : null
    })
  }

  get managedConsoleRoute (): boolean {
    return isManagedConsolePath(this.$route.path)
  }

  // The rail is a printer's pages, so only a printer's page has it; Printers
  // and the account's pages use the whole width.
  get showRail (): boolean {
    return !this.managedConsoleRoute && this.printerFrame && !this.isMobileViewport
  }

  /** The rail's width, as AppRail sets it: icons only below the lg breakpoint. */
  get railWidth (): number {
    return this.$vuetify.breakpoint.mdAndDown ? this.$globals.RAIL_WIDTH_COMPACT : this.$globals.RAIL_WIDTH
  }

  // Not on /slice: the slicer in its frame has its own bar at the bottom.
  get showTabBar (): boolean {
    return !this.managedConsoleRoute && this.printerFrame && this.isMobileViewport &&
      this.authenticated && this.socketConnected && !this.sliceRoute
  }

  get sliceRoute (): boolean {
    return this.$route.name === 'Slice' || this.$route.name === 'Slice (no printer)'
  }

  // Each printer page is named above its content, with its section's pages
  // as tabs. Not the slicer, which fills the page with its own bar; on a
  // phone the console and G-code preview keep that height for the tool.
  get showPageHeader (): boolean {
    if (!this.printerFrame || this.otherPrinterRoute || this.sliceRoute) return false
    // Shown with the page: while connected, and through a drop, when the page keeps its last view.
    if (!this.connection.page || this.connection.screen) return false
    // On a phone, Overview leads with the printer itself; the top bar names it.
    return !(this.isMobileViewport && ['/', '/console', '/preview'].includes(this.currentPage))
  }

  get columnCount (): number {
    return this.$store.state.config.containerColumnCount as number
  }

  get fileDropRoot () {
    if (this.foreignPrinterRoute) return false
    return this.$route.meta?.fileDropRoot
  }

  get loading () {
    return this.hasWait(this.$waits.onLoadLanguage)
  }

  // While a language loads, the shell is blank. Not on /slice: Fluidd's
  // settings are each printer's, so a switch of printer loads that printer's
  // language again, and a blank shell would unmount the slicer's frame, which
  // stays while Fluidd switches. The shell keeps the language it shows until
  // the new one has loaded, so nothing reads untranslated meanwhile.
  get blankedForLanguage (): boolean {
    return this.loading && !this.managedConsoleRoute && !this.sliceRoute
  }

  get progress (): number {
    const progress = this.$store.getters['printer/getPrintProgress'] as number
    return Math.floor(progress * 100)
  }

  get pageTitle () {
    if (this.managedConsoleRoute) {
      return `Muon3D | ${this.$route.name ?? 'Managed preview'}`
    }

    const instanceName = this.foreignPrinterRoute
      ? foreignRecordForSlug(this.$route.params.printer)?.name ?? 'Other printer'
      : this.$store.getters['config/getDisplayName'] as string
    const pageName = this.$route.name

    if (this.printerPrinting) {
      return `[${this.progress}%] | ${instanceName} | ${pageName}`
    } else {
      return `${instanceName} | ${pageName}`
    }
  }

  get pageIcon (): LinkPropertyHref[] {
    if (this.managedConsoleRoute) return []

    const iconDataUrl = this.printInProgressIconDataUrl || this.defaultIconDataUrl

    return [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '32x32',
        href: iconDataUrl
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '16x16',
        href: iconDataUrl
      }
    ]
  }

  get pageMeta (): MetaPropertyName[] {
    return [
      {
        name: 'theme-color',
        content: this.primaryColor
      }
    ]
  }

  get printInProgressIconDataUrl () {
    if (this.printerPrinting) {
      const favIconSize = 64
      const primaryColor = this.primaryColor
      const secondaryColor = 'rgba(255, 255, 255, 0.10)'
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d') as CanvasRenderingContext2D
      canvas.width = favIconSize
      canvas.height = favIconSize
      const percent = this.progress
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const lineWidth = 8
      const radius = favIconSize / 2 - lineWidth / 2
      const startAngle = 1.5 * Math.PI
      const endAngle = startAngle + (percent * 2 * Math.PI / 100)

      /* Draw the initial gray circle */
      context.moveTo(centerX, centerY)
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
      context.strokeStyle = secondaryColor
      context.lineWidth = lineWidth
      context.stroke()
      context.closePath()

      /* Now draw the progress circle */
      context.moveTo(centerX, centerY)
      context.beginPath()
      context.arc(centerX, centerY, radius, startAngle, endAngle, false)
      context.strokeStyle = primaryColor
      context.lineWidth = lineWidth
      context.stroke()

      return canvas.toDataURL('image/png')
    }
  }

  get defaultIconDataUrl () {
    const logoWithColor = `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><g><path fill="${this.primaryOffsetColor}" d="m 14.853368,33.756571 11.61619,9.661168 c 0.130777,0.111917 0.271485,0.207659 0.419213,0.286738 v 0 l 0.0018,9.59e-4 0.04421,0.02288 0.01682,0.0084 0.03004,0.01466 0.02772,0.01301 0.02085,0.0096 0.03643,0.01614 0.0112,0.0048 c 0.261834,0.111457 0.538454,0.172946 0.816165,0.185089 v 0 l 0.0094,4.66e-4 0.04421,0.0014 0.01743,3.11e-4 0.03579,1.57e-4 0.03113,-1.57e-4 0.01976,-3.11e-4 0.04638,-0.0016 0.0066,-1.57e-4 c 0.278332,-0.01219 0.555886,-0.07379 0.818498,-0.185864 v 0 l 0.0076,-0.0031 0.04141,-0.01836 0.01581,-0.0072 0.03019,-0.01433 0.03192,-0.01548 0.01367,-0.0071 0.04375,-0.02273 0.0048,-0.0023 c 0.147428,-0.07893 0.287828,-0.174502 0.418278,-0.28627 v 0 L 40.390591,34.385713 46.037415,38.112852 27.999766,56 9.242502,37.397936 Z m 0.408314,-14.451202 11.425655,7.349201 c 0.406292,0.266969 0.859439,0.40053 1.312586,0.400687 0.452679,0 0.90536,-0.133247 1.311963,-0.400064 v 0 l 11.426278,-7.349045 8.736349,4.462197 -21.47459,17.859067 -21.47459,-17.86031 z M 27.999923,0 52.420045,8.9925786 27.999923,24.698769 3.579955,8.9913323 Z" /><path fill="${this.primaryColor}" d="m 28,0 -0.134766,0.05078125 h 0.150391 V 24.689453 L 52.419922,8.9921875 Z m 12.738281,19.306641 -11.425781,7.347656 -0.05859,0.03906 c -0.386465,0.238992 -0.812514,0.358329 -1.238281,0.361329 v 14.558595 l 21.45898,-17.845703 z m -0.347656,15.080078 -10.859375,9.03125 c -0.13045,0.111767 -0.270596,0.206206 -0.417969,0.285156 l -0.0059,0.002 -0.04297,0.02344 -0.01367,0.0078 -0.0332,0.01563 -0.0293,0.01367 -0.01563,0.0078 -0.04102,0.01758 -0.0078,0.0039 c -0.26261,0.112075 -0.540027,0.173357 -0.818359,0.185547 h -0.0078 l -0.04492,0.002 h -0.02148 -0.01563 V 55.984375 L 46.037109,38.113281 Z" /></g></svg>`

    return `data:image/svg+xml;base64,${btoa(logoWithColor)}`
  }

  get customStyleSheet () {
    return this.$store.getters['config/getCustomThemeFile']('custom', ['.css'])
  }

  @Watch('customStyleSheet')
  async onCustomStyleSheet (value: string) {
    if (!value) {
      return
    }

    const url = await this.createFileUrlWithToken(value, 'config')

    const oldCustomStylesheet = document.getElementById('customStylesheet')

    if (oldCustomStylesheet) {
      oldCustomStylesheet.setAttribute('href', url)
      return
    }

    const linkElement = document.createElement('link')

    linkElement.rel = 'stylesheet'
    linkElement.type = 'text/css'
    linkElement.id = 'customStylesheet'
    linkElement.href = url

    document.head.appendChild(linkElement)
  }

  get customBackgroundImage () {
    return this.$store.getters['config/getCustomThemeFile']('background', ['.png', '.jpg', '.jpeg', '.gif'])
  }

  @Watch('customBackgroundImage')
  async onCustomBackgroundImage (value: string) {
    if (!value) {
      return
    }

    const url = await this.createFileUrlWithToken(value, 'config')

    this.customBackgroundImageStyle = {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  mounted () {
    window.addEventListener('dragover', this.handleDragOver)
    window.addEventListener('dragenter', this.handleDragOver)
    window.addEventListener('dragleave', this.handleDragLeave)
    window.addEventListener('drop', this.handleDrop)
    window.addEventListener('keydown', this.handleKeyDown, false)

    // this.onLoadLocale(this.$i18n.locale)
    EventBus.bus.$on('flashMessage', (payload: FlashMessage) => {
      this.flashMessageState.text = (payload && payload.text) || undefined
      this.flashMessageState.type = (payload && payload.type) || undefined
      this.flashMessageState.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessageState.open = true
    })

    const legacyElementsSelectors = [
      "link[rel*='icon'][type='image/png']",
      "meta[name='theme-color']"
    ]

    for (const legacyElementsSelector of legacyElementsSelectors) {
      const legacyElements = document.querySelectorAll(legacyElementsSelector)

      legacyElements.forEach(item => {
        const parentElement = item.parentElement

        if (parentElement) {
          parentElement.removeChild(item)
        }
      })
    }
  }

  beforeDestroy () {
    window.removeEventListener('dragover', this.handleDragOver)
    window.removeEventListener('dragenter', this.handleDragOver)
    window.removeEventListener('dragleave', this.handleDragLeave)
    window.removeEventListener('drop', this.handleDrop)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleDragOver (event: DragEvent) {
    if (
      this.fileDropRoot &&
      event.dataTransfer &&
      hasFilesInDataTransfer(event.dataTransfer)
    ) {
      event.preventDefault()

      this.dragState = true

      event.dataTransfer.dropEffect = 'copy'
    }
  }

  handleDragLeave (event: DragEvent) {
    if (this.fileDropRoot) {
      event.preventDefault()

      if (
        event.target instanceof HTMLElement &&
        event.target.className.includes('fluidd')
      ) {
        this.dragState = false
      }
    }
  }

  async handleDrop (event: DragEvent) {
    const root = this.fileDropRoot

    if (root) {
      event.preventDefault()

      this.dragState = false

      if (event.dataTransfer) {
        const files = await getFilesFromDataTransfer(event.dataTransfer)

        if (files) {
          // On a printer's pages, a model is Slice's to open, not a file to
          // keep; G-code goes in, and one file on its own is offered to print.
          const models = root === 'gcodes' ? files.filter(f => isModelFile(f.file.name)) : []
          const rest = files.filter(f => !models.includes(f))
          if (models.length) EventBus.bus.$emit('model-dropped', models.map(f => f.file.name))
          if (!rest.length) return

          const pathWithRoot = this.$store.getters['files/getCurrentPathByRoot'](root) as string || ''
          const path = pathWithRoot === root
            ? ''
            : pathWithRoot.substring(root.length + 1)

          const wait = `${this.$waits.onFileSystem}/${pathWithRoot}/`

          this.$store.dispatch('wait/addWait', wait)

          await this.uploadFiles(rest, path, root, false)

          this.$store.dispatch('wait/removeWait', wait)

          const gcodes = rest.filter(f => isGcodeFile(f.file.name) && !f.path)
          if (root === 'gcodes' && gcodes.length === 1) {
            EventBus.bus.$emit('job-ready', path ? `${path}/${gcodes[0].file.name}` : gcodes[0].file.name)
          }
        }
      }
    }
  }

  handleKeyDown (event: KeyboardEvent) {
    if (!this.enableKeyboardShortcuts) {
      return
    }

    const shortcut = keyboardEventToKeyboardShortcut(event)

    if (shortcut === 'Ctrl+Shift+E') {
      if (this.foreignPrinterRoute) return
      event.preventDefault()

      this.emergencyStop()

      return
    }

    if (eventTargetIsContentEditable(event)) {
      return
    }

    if (this.handleGoKey(event, shortcut)) {
      return
    }

    switch (shortcut) {
      // The same page of the printer before or after this one.
      case '[':
      case ']': {
        const current = this.foreignPrinterRoute ? this.$route.params.printer : activeSlug()
        const next = this.printerFrame ? stepPrinter(current, shortcut === ']' ? 1 : -1) : null
        if (next) {
          event.preventDefault()
          this.$router.push(samePageFor(this.$route, next)).catch(() => {})
        }
        return
      }

      case 'Shift+X':
        event.preventDefault()
        setProMode(!this.pro)
        return

      case 'u':
        if (!this.foreignPrinterRoute && this.printerFrame && this.socketConnected) {
          event.preventDefault()
          EventBus.bus.$emit('upload-file')
        }
        return

      case 'f':
        if (this.$route.name === 'Camera') {
          event.preventDefault()
          EventBus.bus.$emit('camera-fullscreen')
        }
        return
    }

    if (this.foreignPrinterRoute || !this.klippyReady) {
      return
    }

    switch (shortcut) {
      case 'Shift+C':
        if (
          this.printerPrinting ||
          this.printerPaused
        ) {
          event.preventDefault()

          this.cancelPrint()
        }
        break

      case 'Shift+P':
        if (this.printerPrinting) {
          event.preventDefault()

          this.pausePrint()
        } else if (this.printerPaused) {
          event.preventDefault()

          this.resumePrint()
        }
        break

      case 'Shift+H':
        if (!this.printerPrinting) {
          event.preventDefault()

          this.homeAll()
        }
        break
    }
  }

  /** G then a letter: G P every printer, G O this printer's Overview, G J its Jobs. */
  handleGoKey (event: KeyboardEvent, shortcut: string): boolean {
    const step = this.goKeys.feed(shortcut, Date.now())
    if (!step) return false
    event.preventDefault()
    if (step.kind === 'start') return true

    let to: string | null = null
    if (step.key === ALL_PRINTERS_KEY) {
      to = '/'
    } else if (activeSlug() || this.foreignPrinterRoute) {
      const section = sectionForKey(step.key, this.sectionContext)
      const page = PAGE_KEYS.find(p => p.key === step.key)
      if (section) to = this.sectionTo(section)
      else if (page && !this.foreignPrinterRoute) to = `${scopedPath(page.path, activeSlug())}${page.hash ?? ''}`
    }
    if (to && to !== this.$route.fullPath) this.$router.push(to).catch(() => {})
    return true
  }
}
</script>

<style lang="scss" scoped>
  .muon-shell {
    background: var(--m3d-bg);
    color: var(--m3d-text);
  }

  .muon-main {
    background: var(--m3d-bg);
  }

  .muon-content {
    position: relative;
    z-index: 1;
  }

  // A page from before the connection dropped: its numbers are out of date
  // and its controls would send into nothing, so it is greyed and still.
  .muon-stale {
    filter: grayscale(0.5);
    opacity: 0.55;
    pointer-events: none;
    transition: opacity 0.3s ease;
    user-select: none;
  }

  // The page starts right of the rail from its first paint. Vuetify only
  // moves it there once the rail has registered its width, and a page that
  // paints before then (a slow printer, a busy first render) drew under it.
  // v-main also animates its padding, so the page slid out from under the
  // rail for a fifth of a second when the rail appeared (filmed on Boxwood):
  // the rail is there from the start, so nothing animates.
  .muon-shell--rail .muon-main {
    padding-left: var(--muon-rail-width) !important;
  }

  .muon-main {
    transition: none !important;
  }

  // Room for the tab bar, so the last card can scroll clear of it.
  .muon-shell--tabbed .muon-content {
    padding-bottom: calc(96px + env(safe-area-inset-bottom)) !important;
  }

  .muon-background-logo {
    pointer-events: none;
    position: fixed;
    width: 40%;
    height: auto;
    right: -8%;
    bottom: -16%;
    opacity: 0.04;
  }
</style>
