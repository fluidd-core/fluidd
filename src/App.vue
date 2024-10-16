<template>
  <v-app
    class="fluidd"
    :class="{ 'no-pointer-events': dragState }"
  >
    <app-tools-drawer v-model="toolsdrawer" />
    <app-nav-drawer v-model="navdrawer" />

    <inline-svg
      v-if="showBackgroundLogo && !isMobileViewport"
      :src="logoSrc"
      class="background-logo"
    />

    <app-bar
      @toolsdrawer="handleToolsDrawerChange"
      @navdrawer="handleNavDrawerChange"
    />

    <flash-message
      v-if="flashMessageState"
      v-model="flashMessageState.open"
      :text="flashMessageState.text"
      :type="flashMessageState.type"
      :timeout="flashMessageState.timeout"
    />

    <v-btn
      v-if="isMobileViewport && authenticated && socketConnected"
      x-small
      fab
      fixed
      bottom
      left
      class="ml-2 mb-2"
      color="error"
      style="z-index: 2000"
      @click="emergencyStop()"
    >
      <v-icon>$estop</v-icon>
    </v-btn>

    <v-main :style="customBackgroundImageStyle">
      <v-container
        fluid
        :class="{
          'fill-height': $route.meta?.fillHeight ?? false,
          [['single', 'double', 'triple', 'quad'][columnCount - 1]]: true
        }"
        class="constrained-width pa-2 pa-sm-4"
      >
        <v-row
          v-if="
            (socketConnected && apiConnected) &&
              (!klippyReady || hasWarnings) &&
              !inLayout &&
              $route.path !== '/login'
          "
        >
          <v-col>
            <klippy-status-card />
          </v-col>
        </v-row>

        <router-view
          v-if="
            (socketConnected && apiConnected) ||
              (!authenticated && apiConnected)
          "
        />

        <register-service-worker />
      </v-container>

      <socket-disconnected
        v-if="
          (!socketConnected && !apiConnected) ||
            (!socketConnected && authenticated)"
      />

      <file-system-download-dialog />
      <updating-dialog />
      <spool-selection-dialog />
      <action-command-prompt-dialog />
      <keyboard-shortcuts-dialog />
    </v-main>

    <app-footer />

    <app-drag-overlay
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

@Component<App>({
  metaInfo () {
    return {
      title: this.pageTitle,
      link: this.pageIcon,
      meta: this.pageMeta
    }
  },
  components: {
    SpoolSelectionDialog,
    FileSystemDownloadDialog,
    ActionCommandPromptDialog,
    KeyboardShortcutsDialog
  }
})
export default class App extends Mixins(StateMixin, FilesMixin, BrowserMixin) {
  toolsdrawer: boolean | null = null
  navdrawer: boolean | null = null
  dragState = false
  customBackgroundImageStyle: Record<string, string> = {}

  flashMessageState: FlashMessage = {
    open: false,
    text: undefined,
    type: undefined
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

  get columnCount (): number {
    return this.$store.state.config.containerColumnCount as number
  }

  get fileDropRoot () {
    return this.$route.meta?.fileDropRoot
  }

  get progress (): number {
    const progress = this.$store.getters['printer/getPrintProgress'] as number
    return Math.floor(progress * 100)
  }

  get pageTitle () {
    const instanceName = this.$store.state.config.uiSettings.general.instanceName || ''
    const pageName = this.$route.name

    if (this.printerPrinting) {
      return `[${this.progress}%] | ${instanceName} | ${pageName}`
    } else {
      return `${instanceName} | ${pageName}`
    }
  }

  get pageIcon (): LinkPropertyHref[] {
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

  handleToolsDrawerChange () {
    this.toolsdrawer = !this.toolsdrawer
  }

  handleNavDrawerChange () {
    this.navdrawer = !this.navdrawer
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
          const pathWithRoot = this.$store.getters['files/getCurrentPathByRoot'](root) as string || ''
          const path = pathWithRoot === root
            ? ''
            : pathWithRoot.substring(root.length + 1)

          const wait = `${this.$waits.onFileSystem}/${pathWithRoot}/`

          this.$store.dispatch('wait/addWait', wait)

          await this.uploadFiles(files, path, root, false)

          this.$store.dispatch('wait/removeWait', wait)
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
      event.preventDefault()

      this.emergencyStop()

      return
    }

    if (
      !this.klippyReady ||
      eventTargetIsContentEditable(event)
    ) {
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
}
</script>

<style lang="scss" scoped>
  .background-logo {
    pointer-events: none;
    position: fixed;
    width: 50%;
    height: auto;
    right: -10%;
    bottom: -20%;
    opacity: 8%;
  }
</style>
