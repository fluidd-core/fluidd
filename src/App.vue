<template>
  <v-app class="fluidd">
    <vue-headful
      :title="pageTitle"
      :head="pageIcon"
    >
    </vue-headful>

    <app-drawer v-model="drawer"></app-drawer>
    <app-bar @drawer="onDrawerChange"></app-bar>

    <FlashMessage
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-main>
      <router-view v-if="socketConnected" />
      <socket-disconnected-widget v-if="!socketConnected"></socket-disconnected-widget>
      <dialog-update-status></dialog-update-status>
    </v-main>

    <app-footer></app-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import EventBus from '@/eventBus'
import UtilsMixin from './mixins/utils'
import { FlashMessage as FlashMessageType } from '@/types'
import AppBar from '@/components/AppBar.vue'
import AppDrawer from '@/components/AppDrawer.vue'
import AppFooter from '@/components/AppFooter.vue'
import SocketDisconnectedWidget from '@/components/widgets/SocketDisconnectedWidget.vue'
import FlashMessage from '@/components/FlashMessage.vue'
import DialogUpdateStatus from '@/components/dialogs/dialogUpdateStatus.vue'

@Component({
  components: {
    AppBar,
    AppDrawer,
    SocketDisconnectedWidget,
    FlashMessage,
    AppFooter,
    DialogUpdateStatus
  }
})
export default class App extends Mixins(UtilsMixin) {
  drawer = false
  showUpdateUI = false

  flashMessage: FlashMessageType = {
    open: false,
    text: undefined,
    type: undefined
  }

  // created () {
  //   if (this.$workbox) {
  //     this.$workbox.addEventListener('waiting', () => {
  //       this.showUpdateUI = true
  //     })
  //   }
  // }

  mounted () {
    this.$vuetify.theme.dark = this.$store.state.config.fileConfig.general.darkMode
    EventBus.$on('flashMessage', (payload: FlashMessageType) => {
      this.flashMessage.text = (payload && payload.text) || undefined
      this.flashMessage.type = (payload && payload.type) || undefined
      this.flashMessage.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessage.open = true
    })
  }

  // async accept () {
  //   this.showUpdateUI = false
  //   if (this.$workbox) {
  //     await this.$workbox.messageSW({ type: 'SKIP_WAITING' })
  //   }
  // }

  get updating () {
    return this.$store.state.version.busy
  }

  get progress () {
    let progress = this.$store.state.socket.printer.display_status.progress || 0
    progress = (progress * 100).toFixed()
    return progress
  }

  get pageTitle () {
    const instanceName = this.$store.state.config.fileConfig.general.instanceName || ''
    const pageName = this.$route.name

    if (this.printerPrinting) {
      return `[${this.progress}%] | ${pageName} | ${instanceName}`
    } else {
      return `${pageName} | ${instanceName}`
    }
  }

  get pageIcon () {
    let iconUrl

    if (this.printerPrinting) {
      const favIconSize = 64
      const percent = this.progress
      const primaryColor = this.$vuetify.theme.currentTheme.primary as string
      const secondaryColor = 'rgba(255, 255, 255, 0.10)'

      const canvas = document.createElement('canvas') as HTMLCanvasElement
      canvas.width = favIconSize
      canvas.height = favIconSize
      const context = canvas.getContext('2d') as CanvasRenderingContext2D
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const lineWidth = 8
      const radius = favIconSize / 2 - lineWidth / 2
      const startAngle = 1 * Math.PI
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

      iconUrl = canvas.toDataURL('image/png')
    }

    return {
      'link[rel="icon"][sizes="32x32"]': {
        href: iconUrl || `${process.env.BASE_URL}img/icons/favicon-32x32.png`
      },
      'link[rel="icon"][sizes="16x16"]': {
        href: iconUrl || `${process.env.BASE_URL}img/icons/favicon-16x16.png`
      }
    }
  }

  onDrawerChange () {
    this.drawer = !this.drawer
  }
}
</script>

<style lang="scss" scoped>
  .title {
    background: linear-gradient(45deg, #1970b5, #9accf5);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .logo {
    margin-right: 12px;
    max-height: 40px;
    max-width: 40px;
    object-fit: contain;
  }
</style>
