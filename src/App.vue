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
      v-if="isMobileViewport && socketConnected && authenticated"
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
              $route.name !== 'login'
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

      <template v-if="socketConnected">
        <file-system-download-dialog />
        <file-system-upload-dialog />
        <updating-dialog />
        <spool-selection-dialog />
        <action-command-prompt-dialog />
        <keyboard-shortcuts-dialog />
        <manual-probe-dialog />
        <bed-screws-adjust-dialog />
        <screws-tilt-adjust-dialog />
        <mmu-edit-ttg-map-dialog />
      </template>
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
import FileSystemUploadDialog from '@/components/widgets/filesystem/FileSystemUploadDialog.vue'
import SpoolSelectionDialog from '@/components/widgets/spoolman/SpoolSelectionDialog.vue'
import type { FlashMessage } from '@/types'
import { getFilesFromDataTransfer, hasFilesInDataTransfer } from '@/util/file-system-entry'
import type { ThemeConfig } from '@/store/config/types'
import ActionCommandPromptDialog from '@/components/common/ActionCommandPromptDialog.vue'
import KeyboardShortcutsDialog from '@/components/common/KeyboardShortcutsDialog.vue'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'
import MmuEditTtgMapDialog from './components/widgets/mmu/MmuEditTtgMapDialog.vue'

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
    FileSystemUploadDialog,
    ActionCommandPromptDialog,
    KeyboardShortcutsDialog,
    MmuEditTtgMapDialog
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
    return this.$typedState.config.uiSettings.theme
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
  get updating (): boolean {
    return this.$typedState.version.status?.busy ?? false
  }

  get inLayout (): boolean {
    return (this.$typedState.config.layoutMode)
  }

  get columnCount (): number {
    return this.$typedState.config.containerColumnCount
  }

  get fileDropRoot () {
    return this.$route.meta?.fileDropRoot
  }

  get progress (): number {
    const progress: number = this.$typedGetters['printer/getPrintProgress']
    return Math.floor(progress * 100)
  }

  get pageTitle () {
    const instanceName: string = this.$typedState.config.uiSettings.general.instanceName || ''
    const pageName = this.$t(`app.general.title.${this.$route.name}`)

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
      const secondaryColor = 'rgba(128, 128, 128, 0.3)'
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = favIconSize
        canvas.height = favIconSize
        const percent = this.progress
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const lineWidth = 10
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
  }

  get defaultIconDataUrl () {
    const logoWithColor = `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><g><path fill="${this.primaryOffsetColor}" d="m14.853 33.757 11.617 9.66q.196.169.419.287l.002.001.044.023.017.009.03.014.027.013.021.01.037.016.01.005c.263.111.54.173.817.185h.01l.044.002h.104l.046-.002h.007a2.3 2.3 0 0 0 .818-.186l.008-.003.041-.018.016-.007.03-.015.032-.015.014-.007.044-.023.004-.002a2.3 2.3 0 0 0 .419-.287l10.86-9.031 5.646 3.727L28 56 9.243 37.398Zm.409-14.452 11.425 7.35c.407.267.86.4 1.313.4s.905-.133 1.312-.4l11.426-7.349 8.737 4.462L28 41.628 6.525 23.767zM28 0l24.42 8.993L28 24.699 3.58 8.99Z" /><path fill="${this.primaryColor}" d="m28 0-.135.05h.15v24.64L52.42 8.991Zm12.738 19.307-11.425 7.347-.06.04a2.4 2.4 0 0 1-1.237.36v14.56l21.459-17.846zm-.347 15.08-10.86 9.031q-.196.167-.418.285l-.006.002-.043.024-.013.007-.033.016-.03.014-.015.007-.041.018-.008.004c-.263.112-.54.173-.819.185h-.007l-.045.002h-.037v12.002l18.021-17.87Z" /></g></svg>`

    return `data:image/svg+xml;base64,${btoa(logoWithColor)}`
  }

  get customStyleSheet (): string | undefined {
    return this.$typedGetters['config/getCustomThemeFile']('custom', ['.css'])
  }

  @Watch('customStyleSheet')
  async onCustomStyleSheet (value: string | undefined) {
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

  get customBackgroundImage (): string | undefined {
    return this.$typedGetters['config/getCustomThemeFile']('background', ['.png', '.jpg', '.jpeg', '.gif'])
  }

  @Watch('customBackgroundImage')
  async onCustomBackgroundImage (value: string | undefined) {
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
    return this.$typedState.config.uiSettings.general.enableKeyboardShortcuts
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
      this.socketConnected &&
      this.authenticated &&
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
          const pathWithRoot: string = this.$typedGetters['files/getCurrentPathByRoot'](root)
          const path = pathWithRoot === root
            ? ''
            : pathWithRoot.substring(root.length + 1)

          const wait = `${this.$waits.onFileSystem}/${pathWithRoot}/`

          this.$typedDispatch('wait/addWait', wait)

          await this.uploadFiles(files, path, root, false)

          this.$typedDispatch('wait/removeWait', wait)
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
