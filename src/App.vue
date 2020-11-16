<template>
  <v-app class="fluidd">
    <app-drawer v-model="drawer"></app-drawer>
    <app-bar @drawer="onDrawerChange"></app-bar>

    <FlashMessage
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-main>
      <!-- <p v-if="showUpdateUI">UPDATE FOUND. <v-btn @click="accept()">Update</v-btn></p> -->
      <router-view v-if="socketConnected" />
      <socket-disconnected-widget v-if="!socketConnected"></socket-disconnected-widget>
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
// import { MetaInfo } from 'vue-meta'

@Component({
  components: {
    AppBar,
    AppDrawer,
    SocketDisconnectedWidget,
    FlashMessage,
    AppFooter
  }
  // metaInfo (this: App): MetaInfo {
  //   const instanceName = this.instanceName
  //   const progress = this.progress
  //   const r = {
  //     title: '',
  //     titleTemplate: ''
  //   }
  //   if (this.printerPrinting) {
  //     r.titleTemplate = `[${progress}%] | %s | ${instanceName}`
  //   } else {
  //     r.titleTemplate = `%s | ${instanceName}`
  //   }
  //   return r
  // }
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
