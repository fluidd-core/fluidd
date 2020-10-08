<template>
  <v-app>
    <app-bar></app-bar>

    <FlashMessage
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-main>
      <router-view v-if="printerConnected && klippyConnected" />
      <app-disconnected v-if="!printerConnected || !klippyConnected"></app-disconnected>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import EventBus from '@/eventBus'
import UtilsMixin from './mixins/utils'
import { FlashMessage as FlashMessageType } from '@/types'
import AppBar from '@/components/AppBar.vue'
import AppDisconnected from '@/components/AppDisconnected.vue'
import FlashMessage from '@/components/FlashMessage.vue'

@Component({
  components: {
    AppBar,
    AppDisconnected,
    FlashMessage
  }
})
export default class App extends Mixins(UtilsMixin) {
  flashMessage: FlashMessageType = {
    open: false,
    text: undefined,
    type: undefined
  }

  get printerConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get klippyState () {
    return this.$store.state.socket.printer.info.state
  }

  get klippyConnected () {
    if (this.klippyState !== 'ready') {
      return false
    }
    return true
  }

  mounted () {
    this.$vuetify.theme.dark = this.$store.state.darkMode

    EventBus.$on('flashMessage', (payload: FlashMessageType) => {
      this.flashMessage.text = (payload && payload.text) || undefined
      this.flashMessage.type = (payload && payload.type) || undefined
      this.flashMessage.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessage.open = true
    })
  }
}
</script>

<style lang="scss" scoped>
  .title {
    background: -webkit-linear-gradient(45deg, #1970b5, #9accf5);
    background-clip: text;
    -webkit-text-fill-color: transparent;}
  .logo {
    margin-right: 12px;
    max-height: 40px;
    max-width: 40px;
    object-fit: contain;
  }
</style>
