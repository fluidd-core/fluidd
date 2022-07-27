<template>
  <v-app v-if="loading" />
  <v-app
    v-else
    class="fluidd"
  >
    <app-tools-drawer v-model="toolsdrawer" />
    <app-nav-drawer v-model="navdrawer" />

    <app-bar
      @toolsdrawer="handleToolsDrawerChange"
      @navdrawer="handleNavDrawerChange"
    />

    <flash-message
      v-if="flashMessage"
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-btn
      v-if="isMobile && authenticated && socketConnected"
      x-small
      fab
      fixed
      bottom
      left
      class="ml-2 mb-2"
      color="error"
      @click="emergencyStop()"
    >
      <v-icon>$estop</v-icon>
    </v-btn>

    <v-main :style="customBackgroundImageStyle">
      <!-- <pre>authenticated {{ authenticated }}, socketConnected {{ socketConnected }}, apiConnected {{ apiConnected }}</pre> -->
      <v-container
        fluid
        :class="{ 'fill-height': $route.meta && $route.meta.fillHeight }"
        class="pa-2 pa-sm-4"
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
      </v-container>

      <socket-disconnected
        v-if="
          (!socketConnected && !apiConnected) ||
            (!socketConnected && authenticated)"
      />

      <updating-dialog />
    </v-main>

    <app-footer />
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { EventBus, FlashMessage } from '@/eventBus'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import { SocketActions } from '@/api/socketActions'
import { Waits } from '@/globals'
import { LinkPropertyHref } from 'vue-meta'
import { Files, AppFile } from './store/files/types'

@Component<App>({
  metaInfo () {
    const pageTitle = this.pageTitle
    const pageIcon = this.pageIcon

    return {
      title: pageTitle,
      link: pageIcon,
      meta: [
        { name: 'theme-color', content: this.primaryColor }
      ]
    }
  }
})
export default class App extends Mixins(StateMixin, FilesMixin) {
  toolsdrawer: boolean | null = null
  navdrawer: boolean | null = null
  showUpdateUI = false
  customBackgroundImageStyle: Record<string, string> = {}

  flashMessage: FlashMessage = {
    open: false,
    text: undefined,
    type: undefined
  }

  // Our app is in a loading state when the socket isn't quite ready, or
  // our translations are loading.
  get updating () {
    return this.$store.state.version.busy
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get loading () {
    return this.$store.getters['wait/hasWait'](Waits.onLoadLanguage)
  }

  get progress () {
    let progress = this.$store.getters['printer/getPrintProgress']
    progress = (progress * 100).toFixed()
    return progress
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
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
    let icon
    const theme = this.$store.getters['config/getTheme']
    if (this.printerPrinting) {
      // Render the progress indicator.
      const favIconSize = 64
      const primaryColor = theme.currentTheme.primary
      const secondaryColor = 'rgba(255, 255, 255, 0.10)'
      const canvas = document.createElement('canvas') as HTMLCanvasElement
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

      icon = canvas.toDataURL('image/png')
    }

    // Build a base64 encoded version of our svg with the correct theme color.
    const svg_xml = 'data:image/svg+xml;base64,' + btoa(`<svg width="56" height="64" viewBox="0 0 314 361" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g transform="translate(-162.000000, -110.000000)"><path d="M234.444,327.531 L309.066,389.594 C309.906,390.313 310.81,390.928 311.759,391.436 L311.759,391.436 L311.771,391.442 L312.055,391.589 L312.163,391.643 L312.356,391.737 L312.534,391.821 L312.668,391.883 L312.902,391.987 L312.974,392.017 C314.656,392.733 316.433,393.128 318.217,393.206 L318.217,393.206 L318.278,393.209 L318.562,393.218 L318.674,393.22 L318.904,393.221 L319.104,393.22 L319.231,393.218 L319.529,393.208 L319.571,393.207 C321.359,393.128 323.142,392.733 324.829,392.013 L324.829,392.013 L324.877,391.993 L325.143,391.875 L325.244,391.829 L325.438,391.737 L325.643,391.638 L325.731,391.593 L326.012,391.447 L326.042,391.432 C326.989,390.925 327.891,390.311 328.729,389.593 L328.729,389.593 L398.493,331.574 L434.768,355.517 L318.896,470.422 L198.4,350.923 L234.444,327.531 Z M237.067,234.697 L310.465,281.908 C313.075,283.623 315.986,284.481 318.897,284.482 C321.805,284.482 324.713,283.626 327.325,281.912 L327.325,281.912 L400.727,234.702 L456.849,263.367 L318.897,378.093 L180.945,263.359 L237.067,234.697 Z M318.897,110.68 L475.771,168.448 L318.897,269.344 L162.024,168.44 L318.897,110.68 Z" id="Combined-Shape" fill="${theme.currentTheme.primaryOffset}"></path><path d="M318.897,110.68 L475.771,168.448 L319,269.278 L319,111 L318.028,111 L318.897,110.68 Z" id="Combined-Shape" fill="${theme.currentTheme.primary}"></path><path d="M400.727,234.702 L456.849,263.367 L319,378.007 L319.000106,284.481641 C321.735222,284.46261 324.467243,283.686291 326.949875,282.151021 L327.325,281.912 L400.727,234.702 Z" id="Combined-Shape" fill="${theme.currentTheme.primary}"></path><path d="M398.493,331.574 L434.768,355.517 L319,470.319 L319,393.22 L319.104,393.22 L319.231,393.218 L319.529,393.208 L319.571,393.207 C321.359,393.128 323.142,392.733 324.829,392.013 L324.829,392.013 L324.877,391.993 L325.143,391.875 L325.244,391.829 L325.438,391.737 L325.643,391.638 L325.731,391.593 L326.012,391.447 L326.042,391.432 C326.989,390.925 327.891,390.311 328.729,389.593 L328.729,389.593 L398.493,331.574 Z" id="Combined-Shape" fill="${theme.currentTheme.primary}"></path></g></svg>`)

    return [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '32x32',
        href: icon || svg_xml
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '16x16',
        href: icon || svg_xml
      }
    ]
  }

  get primaryColor () {
    const theme = this.$store.getters['config/getTheme']
    return theme.currentTheme.primary
  }

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  get ready () {
    return (this.socketConnected && this.apiConnected) || (!this.authenticated && this.apiConnected)
  }

  get isConfigRootAvailable () {
    return this.$store.getters['files/isRootAvailable']('config')
  }

  get fluiddThemeFiles () {
    return this.isConfigRootAvailable && this.$store.getters['files/getDirectory']('config', 'config/.fluidd-theme')
  }

  @Watch('isConfigRootAvailable')
  onIsConfigRootAvailable (value: boolean) {
    if (value) {
      SocketActions.serverFilesGetDirectory('config', 'config/.fluidd-theme')
    }
  }

  @Watch('fluiddThemeFiles')
  onFluiddThemeFiles (value: Files) {
    if (!value || !value.items) return

    const customStylesheetPath = this.checkFile(value, 'custom', ['.css'])
    if (customStylesheetPath) this.setCustomStylesheet(customStylesheetPath)

    const backgroundImagePath = this.checkFile(value, 'background', ['.png', '.jpg', '.gif'])
    if (backgroundImagePath) this.setCustomBackgroundImage(backgroundImagePath)
  }

  checkFile (directory: Files, filename: string, extensions: string[]) {
    for (const extension of extensions) {
      const file = directory.items.find((f): f is AppFile => f.type === 'file' && f.name === filename + extension)

      if (file) return file.path + '/' + file.filename
    }
    return undefined
  }

  async setCustomStylesheet (customStylesheetPath: string) {
    const url = await this.createFileUrl(customStylesheetPath, 'config')

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

  async setCustomBackgroundImage (backgroundImagePath: string) {
    const url = await this.createFileUrl(backgroundImagePath, 'config')

    this.customBackgroundImageStyle = {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }
    console.log({ customBackgroundImageStyle: this.customBackgroundImageStyle })
  }

  mounted () {
    // this.onLoadLocale(this.$i18n.locale)
    EventBus.bus.$on('flashMessage', (payload: FlashMessage) => {
      this.flashMessage.text = (payload && payload.text) || undefined
      this.flashMessage.type = (payload && payload.type) || undefined
      this.flashMessage.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessage.open = true
    })

    const legacyFavIcons = document.querySelectorAll("link[rel*='icon'][type='image/png']")

    legacyFavIcons.forEach(item => {
      const parentElement = item.parentElement

      if (parentElement) {
        parentElement.removeChild(item)
      }
    })
  }

  handleToolsDrawerChange () {
    this.toolsdrawer = !this.toolsdrawer
  }

  handleNavDrawerChange () {
    this.navdrawer = !this.navdrawer
  }
}
</script>
