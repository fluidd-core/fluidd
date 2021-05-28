<template>
  <v-app v-if="loading"></v-app>
  <v-app v-else class="fluidd">
    <vue-headful
      :title="pageTitle"
      :head="pageIcon"
    >
    </vue-headful>

    <app-tools-drawer v-model="toolsdrawer"></app-tools-drawer>
    <app-nav-drawer></app-nav-drawer>

    <app-bar
      @toolsdrawer="handleToolsDrawerChange"
    ></app-bar>

    <flash-message
      v-if="flashMessage"
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-btn
      v-if="isMobile && authenticated"
      x-small
      fab
      fixed
      bottom left
      color="error"
      @click="emergencyStop()"
    >
      <v-icon>$estop</v-icon>
    </v-btn>

    <v-main>
      <!-- <pre>authenticated {{ authenticated }}, socketConnected {{ socketConnected }}, apiConnected {{ apiConnected }}</pre> -->
      <router-view name="navigation"></router-view>
      <router-view v-if="(apiConnected && socketConnected) || (!authenticated && apiConnected)" />
      <socket-disconnected v-if="!socketConnected && authenticated"></socket-disconnected>
      <updating-dialog></updating-dialog>
    </v-main>

    <app-footer></app-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { EventBus, FlashMessage } from '@/eventBus'
import StateMixin from './mixins/state'
import { Waits } from './globals'

@Component({})
export default class App extends Mixins(StateMixin) {
  toolsdrawer = false
  showUpdateUI = false

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
      return `${instanceName} | ${pageName} | [${this.progress}%]`
    } else {
      return `${instanceName} | ${pageName}`
    }
  }

  get pageIcon () {
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

    return {
      'link[rel="icon"][sizes="32x32"]': {
        href: icon || svg_xml
      },
      'link[rel="icon"][sizes="16x16"]': {
        href: icon || svg_xml
      }
    }
  }

  mounted () {
    // this.onLoadLocale(this.$i18n.locale)
    EventBus.bus.$on('flashMessage', (payload: FlashMessage) => {
      this.flashMessage.text = (payload && payload.text) || undefined
      this.flashMessage.type = (payload && payload.type) || undefined
      this.flashMessage.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessage.open = true
    })
  }

  handleToolsDrawerChange () {
    this.toolsdrawer = !this.toolsdrawer
  }
}
</script>
